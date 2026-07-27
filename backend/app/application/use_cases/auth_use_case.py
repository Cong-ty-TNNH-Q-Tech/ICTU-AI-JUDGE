"""
Auth Use Case — UC01: Authenticate via Google OAuth.
UC01 Extension: Auto-promote Root Admin to ADMIN role on first login.
"""
import logging
import uuid
from datetime import datetime, timezone

from app.application.interfaces.repositories import IUserRepository
from app.application.interfaces.clients import IGoogleAuthClient
from app.domain.entities.entities import UserEntity, UserRole
from app.domain.exceptions.exceptions import AuthenticationError

logger = logging.getLogger(__name__)

class AuthUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        google_client: IGoogleAuthClient,
        root_admin_email: str | None = None,
    ):
        self._user_repo = user_repo
        self._google_client = google_client
        self._root_admin_email = root_admin_email

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

        if not email.endswith("@ictu.edu.vn"):
            raise AuthenticationError("Chỉ chấp nhận email thuộc tên miền @ictu.edu.vn.")

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
