import uuid
from unittest.mock import MagicMock
import pytest
from datetime import datetime

from app.application.use_cases.auth_use_case import AuthUseCase
from app.domain.entities.entities import UserEntity, UserRole
from app.domain.exceptions.exceptions import AuthenticationError
from app.core.security import hash_password

@pytest.fixture
def auth_use_case():
    user_repo = MagicMock()
    google_client = MagicMock()
    password_reset_repo = MagicMock()
    uow = MagicMock()
    return AuthUseCase(user_repo, google_client, password_reset_repo, uow)

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

def test_login_with_password_success(auth_use_case):
    user = UserEntity(
        id=uuid.uuid4(),
        email="test@test.com",
        student_id="test",
        full_name="Test",
        role=UserRole.STUDENT,
        password_hash=hash_password("password123"),
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    auth_use_case._user_repo.get_by_email.return_value = user
    
    logged_in_user = auth_use_case.login_with_password("test@test.com", "password123")
    assert logged_in_user.id == user.id

def test_login_with_password_invalid(auth_use_case):
    auth_use_case._user_repo.get_by_email.return_value = None
    with pytest.raises(AuthenticationError):
        auth_use_case.login_with_password("test@test.com", "password123")

def test_request_password_reset_success(auth_use_case):
    user = UserEntity(
        id=uuid.uuid4(),
        email="test@test.com",
        student_id="test",
        full_name="Test",
        role=UserRole.STUDENT,
        password_hash="",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    auth_use_case._user_repo.get_by_email.return_value = user
    auth_use_case._password_reset_repo.get_latest_by_user_id.return_value = None
    
    result = auth_use_case.request_password_reset("test@test.com")
    
    assert result is not None
    assert result[0] == "test@test.com"
    assert result[1] == "Test"
    auth_use_case._password_reset_repo.save.assert_called_once()
    auth_use_case._uow.commit.assert_called_once()

def test_request_password_reset_rate_limit(auth_use_case):
    from app.domain.entities.entities import PasswordResetEntity
    from app.domain.exceptions.exceptions import PasswordResetRateLimitError
    from datetime import timedelta, timezone
    
    user = UserEntity(
        id=uuid.uuid4(),
        email="test@test.com",
        student_id="test",
        full_name="Test",
        role=UserRole.STUDENT,
        password_hash="",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    reset_entity = PasswordResetEntity(
        id=uuid.uuid4(),
        user_id=user.id,
        token="token",
        expires_at=datetime.now(tz=timezone.utc) + timedelta(minutes=14),
        used=False
    )
    auth_use_case._user_repo.get_by_email.return_value = user
    auth_use_case._password_reset_repo.get_latest_by_user_id.return_value = reset_entity
    
    with pytest.raises(PasswordResetRateLimitError):
        auth_use_case.request_password_reset("test@test.com")
def test_change_password(auth_use_case):
    user = UserEntity(
        id=uuid.uuid4(),
        email="test@test.com",
        student_id="test",
        full_name="Test",
        role=UserRole.STUDENT,
        password_hash=hash_password("oldpassword"),
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    auth_use_case._user_repo.get_by_id.return_value = user

    auth_use_case.change_password(user.id, "oldpassword", "newpassword")

    auth_use_case._user_repo.update_password.assert_called_once()
    auth_use_case._uow.commit.assert_called_once()

def test_reset_password(auth_use_case):
    from app.domain.entities.entities import PasswordResetEntity
    user = UserEntity(
        id=uuid.uuid4(),
        email="test@test.com",
        student_id="test",
        full_name="Test",
        role=UserRole.STUDENT,
        password_hash="",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    from datetime import timedelta, timezone
    reset = PasswordResetEntity(
        id=uuid.uuid4(),
        user_id=user.id,
        token="validtoken",
        expires_at=datetime.now(tz=timezone.utc) + timedelta(minutes=10),
        used=False
    )
    auth_use_case._password_reset_repo.get_by_token.return_value = reset
    auth_use_case._user_repo.get_by_id.return_value = user

    auth_use_case.reset_password("validtoken", "newpassword")

    auth_use_case._user_repo.update_password.assert_called_once()
    auth_use_case._password_reset_repo.mark_as_used.assert_called_once_with(reset.id)
    auth_use_case._uow.commit.assert_called_once()

