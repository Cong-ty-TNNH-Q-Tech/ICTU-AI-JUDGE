"""
Auth Use Case — UC01: Authenticate via Google OAuth.
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
    def __init__(self, user_repo: IUserRepository, google_client: IGoogleAuthClient):
        self._user_repo = user_repo
        self._google_client = google_client

    def login_with_google(self, google_token: str) -> UserEntity:
        """
        Verify Google Token and return UserEntity.
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

        student_id = email.split("@")[0]
        full_name = data.get("name", "Student")

        user = self._user_repo.get_by_email(email)
        if user:
            # Update user if necessary, but here we just return
            return user
        
        # Create new user
        new_user = UserEntity(
            id=uuid.uuid4(),
            email=email,
            student_id=student_id,
            full_name=full_name,
            role=UserRole.STUDENT,
            password_hash="", # OAuth users don't have a password
            created_at=datetime.now(tz=timezone.utc),
            updated_at=datetime.now(tz=timezone.utc),
            deleted_at=None,
        )
        saved_user = self._user_repo.save(new_user)
        logger.info(f"Created new user via Google OAuth: {email}")
        return saved_user
