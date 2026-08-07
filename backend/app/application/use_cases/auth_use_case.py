"""
Auth Use Case — UC01: Authenticate via Google OAuth.
UC01 Extension: Auto-promote Root Admin to ADMIN role on first login.
"""
import logging
import secrets
import uuid
import json
import random
from datetime import datetime, timedelta, timezone

from app.application.interfaces.repositories import IUserRepository, IPasswordResetRepository, IUnitOfWork
from app.application.interfaces.clients import IGoogleAuthClient, IMailClient, ICacheClient
from app.domain.entities.entities import UserEntity, UserRole, PasswordResetEntity
from app.domain.exceptions.exceptions import AuthenticationError, InvalidPasswordError, InvalidTokenError, NotFoundError, PasswordResetRateLimitError
from app.core.security import verify_password, hash_password

logger = logging.getLogger(__name__)

class AuthUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        google_client: IGoogleAuthClient,
        password_reset_repo: IPasswordResetRepository,
        mail_client: IMailClient,
        cache_client: ICacheClient,
        uow: IUnitOfWork,
        root_admin_email: str | None = None,
        frontend_url: str = "http://localhost:5173",
    ):
        self._user_repo = user_repo
        self._google_client = google_client
        self._password_reset_repo = password_reset_repo
        self._mail_client = mail_client
        self._cache_client = cache_client
        self._uow = uow
        self._root_admin_email = root_admin_email
        self._frontend_url = frontend_url

    def _is_root_admin(self, email: str) -> bool:
        """So sánh case-insensitive + trim whitespace để tránh bypass."""
        if not self._root_admin_email:
            return False
        return email.lower().strip() == self._root_admin_email.lower().strip()

    def login_with_google(self, google_token: str) -> UserEntity:
        """
        Verify Google Token and return UserEntity.
        Nếu email khớp ROOT_ADMIN_EMAIL → tự động gán role ADMIN.
        Raises AuthenticationError if token is invalid or email is not @ictu.edu.vn.
        """
        data = self._google_client.verify_token(google_token)

        email = data.get("email", "")
        if not email:
            raise AuthenticationError("Không tìm thấy email trong Token.")

        if data.get("email_verified") not in (True, "true"):
            raise AuthenticationError("Email Google chưa được xác thực (email_verified=false).")


        is_root = self._is_root_admin(email)
        student_id = email.split("@")[0]
        full_name = data.get("name", "Student")

        user = self._user_repo.get_by_email(email)
        if user:
            needs_save = False
            if user.full_name != full_name:
                user.full_name = full_name
                needs_save = True
            if is_root and user.role != UserRole.ADMIN:
                user.role = UserRole.ADMIN
                needs_save = True
                logger.info("Root admin role promoted for existing user: %s", email)
            if needs_save:
                user = self._user_repo.save(user)
            return user

        role = UserRole.ADMIN if is_root else UserRole.STUDENT
        new_user = UserEntity(
            id=uuid.uuid4(),
            email=email,
            student_id=student_id,
            full_name=full_name,
            role=role,
            password_hash="",  # OAuth users don't have a password
            created_at=datetime.now(tz=timezone.utc),
            updated_at=datetime.now(tz=timezone.utc),
            deleted_at=None,
        )
        if is_root:
            logger.info("Root admin account created via Google OAuth: %s", email)
        else:
            logger.info("Created new user via Google OAuth: %s", email)
        return self._user_repo.save(new_user)

    def login_with_password(self, email: str, password: str) -> UserEntity:
        """
        Đăng nhập bằng email và mật khẩu.
        Raises AuthenticationError nếu email/password không đúng.
        """
        user = self._user_repo.get_by_email(email)
        # Không tiết lộ email nào tồn tại để tránh account enumeration
        if not user:
            raise AuthenticationError("Email hoặc mật khẩu không chính xác.")
        if not user.password_hash:
            raise AuthenticationError(
                "Tài khoản này được đăng ký qua Google OAuth. "
                "Vui lòng đăng nhập bằng Google hoặc dùng chức năng Quên mật khẩu để đặt mật khẩu."
            )
        if not verify_password(password, user.password_hash):
            raise AuthenticationError("Email hoặc mật khẩu không chính xác.")
        logger.info("User %s logged in with password.", user.id)
        return user

    def change_password(self, user_id: uuid.UUID, old_password: str, new_password: str) -> None:
        user = self._user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found.")
            
        if not user.is_active():
            raise NotFoundError("User not found.")
        
        if not user.password_hash:
            raise InvalidPasswordError("Tài khoản của bạn được tạo qua Google OAuth và không có mật khẩu. Vui lòng dùng tính năng Quên mật khẩu để đặt mật khẩu mới nếu cần.")
            
        if not verify_password(old_password, user.password_hash):
            raise InvalidPasswordError("Mật khẩu cũ không chính xác.")
            
        hashed = hash_password(new_password)
        self._user_repo.update_password(user_id, hashed)
        self._uow.commit()
        logger.info("User %s changed password successfully.", user_id)

    def request_password_reset(self, email: str) -> tuple[str, str, str] | None:
        user = self._user_repo.get_by_email(email)
        if not user:
            # Do not throw error for security reasons (don't leak which emails exist)
            logger.info("Password reset requested for non-existent email: %s", email)
            return None

        # Rate Limit check: 15 phút (cùng vòng đời của token)
        latest_reset = self._password_reset_repo.get_latest_by_user_id(user.id)
        if latest_reset and not latest_reset.used:
            now = datetime.now(tz=timezone.utc)
            if latest_reset.expires_at > now:
                time_left = (latest_reset.expires_at - now).total_seconds() / 60
                raise PasswordResetRateLimitError(wait_minutes=int(time_left) + 1)

        token = secrets.token_urlsafe(32)
        expires = datetime.now(tz=timezone.utc) + timedelta(minutes=15)

        reset_entity = PasswordResetEntity(
            id=uuid.uuid4(),
            user_id=user.id,
            token=token,
            expires_at=expires,
            used=False
        )
        self._password_reset_repo.save(reset_entity)
        self._uow.commit()
        logger.info("Password reset token generated synchronously in DB for user %s", user.id)

        reset_link = f"{self._frontend_url}/reset-password?token={token}"
        return user.email, user.full_name, reset_link

    def reset_password(self, token: str, new_password: str) -> None:
        reset_entity = self._password_reset_repo.get_by_token(token)
        if not reset_entity:
            raise InvalidTokenError("Đường dẫn đặt lại mật khẩu không hợp lệ.")
            
        if reset_entity.used:
            raise InvalidTokenError("Đường dẫn đặt lại mật khẩu đã được sử dụng.")
            
        if reset_entity.expires_at < datetime.now(tz=timezone.utc):
            raise InvalidTokenError("Đường dẫn đặt lại mật khẩu đã hết hạn.")
            
        user = self._user_repo.get_by_id(reset_entity.user_id)
        if not user:
            raise NotFoundError("User not found.")
            
        hashed = hash_password(new_password)
        self._user_repo.update_password(user.id, hashed)
        self._password_reset_repo.mark_as_used(reset_entity.id)
        self._uow.commit()
        logger.info("Password reset successfully for user %s", user.id)

    def request_registration(self, email: str, password: str, full_name: str, student_id: str) -> None:
        if not email.endswith("@ictu.edu.vn"):
            raise AuthenticationError("Chỉ chấp nhận email thuộc tên miền @ictu.edu.vn.")
            
        user = self._user_repo.get_by_email(email)
        if user:
            raise AuthenticationError("Email này đã được đăng ký.")
            
        # Generate 6-digit OTP
        otp = f"{random.randint(0, 999999):06d}"
        
        # Save to Redis with 5 minutes expiration
        key = f"reg_otp:{email}"
        payload = {
            "otp": otp,
            "password_hash": hash_password(password),
            "full_name": full_name,
            "student_id": student_id,
        }
        self._cache_client.set(key, json.dumps(payload), 300)
        
        # Send Email
        subject = "Mã xác nhận đăng ký tài khoản ICTU AI Judge"
        html_content = f"""
        <html>
            <body>
                <h2>Xin chào {full_name},</h2>
                <p>Mã xác nhận (OTP) để đăng ký tài khoản của bạn là: <strong>{otp}</strong></p>
                <p>Mã này có hiệu lực trong vòng 5 phút.</p>
                <br/>
                <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
            </body>
        </html>
        """
        self._mail_client.send_email(email, subject, html_content)
        logger.info("Registration OTP sent to %s", email)

    def verify_registration_otp(self, email: str, otp: str) -> UserEntity:
        key = f"reg_otp:{email}"
        data_str = self._cache_client.get(key)
        
        if not data_str:
            raise AuthenticationError("Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng đăng ký lại.")
            
        data = json.loads(data_str)
        if data.get("otp") != otp:
            raise AuthenticationError("Mã OTP không chính xác.")
            
        # Create user
        is_root = self._is_root_admin(email)
        role = UserRole.ADMIN if is_root else UserRole.STUDENT
        
        new_user = UserEntity(
            id=uuid.uuid4(),
            email=email,
            student_id=data.get("student_id", ""),
            full_name=data.get("full_name", ""),
            role=role,
            password_hash=data.get("password_hash", ""),
            created_at=datetime.now(tz=timezone.utc),
            updated_at=datetime.now(tz=timezone.utc),
            deleted_at=None,
        )
        
        saved_user = self._user_repo.save(new_user)
        self._uow.commit()
        
        self._cache_client.delete(key)
        logger.info("User registered successfully via OTP: %s", email)
        
        return saved_user

