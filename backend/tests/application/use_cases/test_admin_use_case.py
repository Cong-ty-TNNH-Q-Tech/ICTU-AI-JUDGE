import uuid
from unittest.mock import MagicMock
import pytest
from fastapi import HTTPException
from datetime import datetime

from app.application.use_cases.admin_use_case import AdminUseCase
from app.domain.entities.entities import UserEntity, UserRole, ChallengeEntity, ChallengeType, ChallengeStatus, MetricDirection, SubmissionEntity, SubmissionStatus

@pytest.fixture
def admin_use_case():
    user_repo = MagicMock()
    challenge_repo = MagicMock()
    submission_repo = MagicMock()
    leaderboard_repo = MagicMock()
    return AdminUseCase(user_repo, challenge_repo, submission_repo, leaderboard_repo)

def test_list_users(admin_use_case):
    uid = uuid.uuid4()
    mock_user = UserEntity(
        id=uid,
        email="test@example.com",
        student_id="DTC123",
        full_name="Test User",
        role=UserRole.STUDENT,
        password_hash="hash",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    admin_use_case.user_repo.list_all.return_value = ([mock_user], 1)
    
    result = admin_use_case.list_users(q="test", page=1, size=10)
    assert result.total == 1
    assert len(result.items) == 1
    assert result.items[0].email == "test@example.com"

def test_update_user_status_success(admin_use_case):
    admin_use_case.user_repo.update_status.return_value = True
    result = admin_use_case.update_user_status(uuid.uuid4(), True)
    assert result["detail"] == "Cập nhật trạng thái thành công"

def test_update_user_status_not_found(admin_use_case):
    admin_use_case.user_repo.update_status.return_value = False
    with pytest.raises(HTTPException) as exc:
        admin_use_case.update_user_status(uuid.uuid4(), True)
    assert exc.value.status_code == 404

def test_update_user_role_success(admin_use_case):
    admin_use_case.user_repo.update_role.return_value = True
    result = admin_use_case.update_user_role(uuid.uuid4(), "ADMIN")
    assert result["detail"] == "Cập nhật quyền thành công"

def test_update_user_role_not_found(admin_use_case):
    admin_use_case.user_repo.update_role.return_value = False
    with pytest.raises(HTTPException) as exc:
        admin_use_case.update_user_role(uuid.uuid4(), "ADMIN")
    assert exc.value.status_code == 404

def test_get_whitelist_success(admin_use_case):
    challenge_id = uuid.uuid4()
    admin_use_case.challenge_repo.get_by_id.return_value = MagicMock()
    admin_use_case.challenge_repo.list_participants.return_value = (["user1", "user2"], 2)
    
    result = admin_use_case.get_whitelist(challenge_id, 1, 10)
    assert result["total"] == 2
    assert len(result["data"]) == 2

def test_get_whitelist_not_found(admin_use_case):
    admin_use_case.challenge_repo.get_by_id.return_value = None
    with pytest.raises(HTTPException) as exc:
        admin_use_case.get_whitelist(uuid.uuid4(), 1, 10)
    assert exc.value.status_code == 404

def test_add_whitelist_success(admin_use_case):
    challenge = MagicMock()
    challenge.type = ChallengeType.COMPETITION
    admin_use_case.challenge_repo.get_by_id.return_value = challenge
    admin_use_case.challenge_repo.add_participants.return_value = 2
    
    result = admin_use_case.add_whitelist(uuid.uuid4(), [uuid.uuid4(), uuid.uuid4()])
    assert result["detail"] == "Đã thêm 2 sinh viên vào whitelist thành công"

def test_add_whitelist_not_competition(admin_use_case):
    challenge = MagicMock()
    challenge.type = ChallengeType.PUBLIC
    admin_use_case.challenge_repo.get_by_id.return_value = challenge
    
    with pytest.raises(HTTPException) as exc:
        admin_use_case.add_whitelist(uuid.uuid4(), [uuid.uuid4()])
    assert exc.value.status_code == 400

def test_list_all_submissions_success(admin_use_case):
    challenge = MagicMock()
    admin_use_case.challenge_repo.get_by_id.return_value = challenge
    
    sub = SubmissionEntity(
        id=uuid.uuid4(),
        challenge_id=uuid.uuid4(),
        team_id=uuid.uuid4(),
        submitted_by=uuid.uuid4(),
        file_md5_hash="md5",
        file_size_bytes=100,
        file_url="test.csv",
        status=SubmissionStatus.PENDING,
        submitted_at=datetime.now()
    )
    admin_use_case.submission_repo.list_all_by_challenge.return_value = ([sub], 1)
    
    result = admin_use_case.list_all_submissions(uuid.uuid4(), 1, 10)
    assert result.total_count == 1
    assert len(result.data) == 1

def test_list_all_submissions_not_found(admin_use_case):
    admin_use_case.challenge_repo.get_by_id.return_value = None
    with pytest.raises(HTTPException) as exc:
        admin_use_case.list_all_submissions(uuid.uuid4(), 1, 10)
    assert exc.value.status_code == 404

def test_export_leaderboard_csv_success(admin_use_case):
    challenge = MagicMock()
    challenge.metric_direction = MetricDirection.HIGHER_IS_BETTER
    admin_use_case.challenge_repo.get_by_id.return_value = challenge
    
    mock_data = [
        {"Rank": 1, "Team Name": "Team A", "MSSV": "123", "Full Name": "Alice", "Public Score": 1.0, "Private Score": 1.0, "Last Submission Time": "2023-01-01"},
        {"Rank": 2, "Team Name": "Team B", "MSSV": "456", "Full Name": "Bob", "Public Score": 0.5, "Private Score": 0.5, "Last Submission Time": "2023-01-02"}
    ]
    admin_use_case.leaderboard_repo.export_all.return_value = mock_data
    
    challenge_id = uuid.uuid4()
    csv_content, filename = admin_use_case.export_leaderboard_csv(challenge_id, "private")
    
    assert filename == f"leaderboard_{challenge_id}_private.csv"
    assert "Team A" in csv_content
    assert "Alice" in csv_content
    assert "Team B" in csv_content
    admin_use_case.leaderboard_repo.export_all.assert_called_once_with(
        challenge_id=challenge_id,
        direction=challenge.metric_direction,
        leaderboard_type="private"
    )

def test_export_leaderboard_csv_not_found(admin_use_case):
    admin_use_case.challenge_repo.get_by_id.return_value = None
    with pytest.raises(HTTPException) as exc:
        admin_use_case.export_leaderboard_csv(uuid.uuid4(), "public")
    assert exc.value.status_code == 404
