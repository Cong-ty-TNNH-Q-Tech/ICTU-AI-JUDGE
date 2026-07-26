"""
Auth Use Case — UC01: Authenticate via Google OAuth.
"""
import json
import logging
import urllib.request
import urllib.error
import uuid
from datetime import datetime, timezone

from app.application.interfaces.repositories import IUserRepository
from app.domain.entities.entities import UserEntity, UserRole
from app.domain.exceptions.exceptions import AuthenticationError

logger = logging.getLogger(__name__)

class AuthUseCase:
    def __init__(self, user_repo: IUserRepository):
        self._user_repo = user_repo

    def login_with_google(self, google_token: str) -> UserEntity:
        """
        Verify Google Token and return UserEntity.
        Raises AuthenticationError if token is invalid or email is not @ictu.edu.vn.
        """
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={google_token}"
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
        except urllib.error.URLError as e:
            logger.warning(f"Google Token verification failed: {e}")
            raise AuthenticationError("Token Google không hợp lệ hoặc đã hết hạn.")
        except Exception as e:
            logger.error(f"Unexpected error during Google Token verification: {e}")
            raise AuthenticationError("Có lỗi xảy ra khi xác thực với Google.")

        email = data.get("email", "")
        if not email:
            raise AuthenticationError("Không tìm thấy email trong Token.")

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
