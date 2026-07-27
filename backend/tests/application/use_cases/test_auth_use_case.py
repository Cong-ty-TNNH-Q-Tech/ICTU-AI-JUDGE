import uuid
from unittest.mock import MagicMock
import pytest
from datetime import datetime

from app.application.use_cases.auth_use_case import AuthUseCase
from app.domain.entities.entities import UserEntity, UserRole
from app.domain.exceptions.exceptions import AuthenticationError

@pytest.fixture
def auth_use_case():
    user_repo = MagicMock()
    google_client = MagicMock()
    return AuthUseCase(user_repo, google_client)

def test_login_with_google_success_new_user(auth_use_case):
    auth_use_case._google_client.verify_token.return_value = {
        "email": "test@ictu.edu.vn",
        "email_verified": True,
        "name": "Test User"
    }
    auth_use_case._user_repo.get_by_email.return_value = None
    
    def mock_save(u):
        return u
    auth_use_case._user_repo.save.side_effect = mock_save
    
    user = auth_use_case.login_with_google("valid_token")
    assert user.email == "test@ictu.edu.vn"
    assert user.student_id == "test"
    assert user.full_name == "Test User"
    assert user.role == UserRole.STUDENT

def test_login_with_google_success_existing_user(auth_use_case):
    auth_use_case._google_client.verify_token.return_value = {
        "email": "test@ictu.edu.vn",
        "email_verified": True,
        "name": "New Name"
    }
    existing_user = UserEntity(
        id=uuid.uuid4(),
        email="test@ictu.edu.vn",
        student_id="test",
        full_name="Old Name",
        role=UserRole.STUDENT,
        password_hash="",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    auth_use_case._user_repo.get_by_email.return_value = existing_user
    auth_use_case._user_repo.save.side_effect = lambda u: u
    
    user = auth_use_case.login_with_google("valid_token")
    assert user.full_name == "New Name"
    auth_use_case._user_repo.save.assert_called_once_with(existing_user)

def test_login_with_google_no_email(auth_use_case):
    auth_use_case._google_client.verify_token.return_value = {}
    with pytest.raises(AuthenticationError, match="Không tìm thấy email trong Token"):
        auth_use_case.login_with_google("token")

def test_login_with_google_email_not_verified(auth_use_case):
    auth_use_case._google_client.verify_token.return_value = {
        "email": "test@ictu.edu.vn",
        "email_verified": False
    }
    with pytest.raises(AuthenticationError, match="Email Google chưa được xác thực"):
        auth_use_case.login_with_google("token")

def test_login_with_google_invalid_domain(auth_use_case):
    auth_use_case._google_client.verify_token.return_value = {
        "email": "test@gmail.com",
        "email_verified": True
    }
    with pytest.raises(AuthenticationError, match="Chỉ chấp nhận email thuộc tên miền @ictu.edu.vn"):
        auth_use_case.login_with_google("token")
