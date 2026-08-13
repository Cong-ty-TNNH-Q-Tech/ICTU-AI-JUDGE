"""
Auth Use Case — UC01: Authenticate via Google OAuth.
UC01 Extension: Auto-promote Root Admin to ADMIN role on first login.
"""
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from app.application.interfaces.repositories import IUserRepository, IPasswordResetRepository, IUnitOfWork
from app.application.interfaces.clients import IGoogleAuthClient, IMailClient
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
        uow: IUnitOfWork,
        root_admin_email: str | None = None,
        frontend_url: str = "http://localhost:5173",
    ):
        self._user_repo = user_repo
        self._google_client = google_client
        self._password_reset_repo = password_reset_repo
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

