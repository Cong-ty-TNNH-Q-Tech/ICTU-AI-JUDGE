import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest

from app.application.use_cases.submission_use_case import SubmissionUseCase
from app.domain.entities.entities import (
    ChallengeEntity,
    SubmissionEntity,
    SubmissionStatus,
    TeamEntity,
    ChallengeStatus,
    ChallengeType,
    MetricDirection
)
from app.domain.exceptions.exceptions import (
    DuplicateSubmissionError,
    FileSizeExceededError,
    RateLimitExceededError,
    PermissionDeniedError,
    NotFoundError,
    SubmissionDeadlinePassedError
)

@pytest.fixture
def mock_repos():
    return {
        "submission_repo": MagicMock(),
        "challenge_repo": MagicMock(),
        "team_repo": MagicMock(),
        "storage_repo": MagicMock(),
        "message_broker": MagicMock(),
        "uow": MagicMock(),
        "leaderboard_repo": MagicMock(),
    }

@pytest.fixture
def use_case(mock_repos):
    return SubmissionUseCase(**mock_repos)

@pytest.fixture
def mock_challenge():
    return ChallengeEntity(
        id=uuid.uuid4(),
        title="Test Challenge",
        description="test",
        type=ChallengeType.COMPETITION,
        metric_name="accuracy",
        metric_direction=MetricDirection.HIGHER_IS_BETTER,
        start_time=datetime.now(timezone.utc) - timedelta(days=1),
        end_time=datetime.now(timezone.utc) + timedelta(days=1),
        status=ChallengeStatus.PUBLISHED,
        max_file_size_mb=10,
        rate_limit_minutes=5,
        team_lock_deadline=datetime.now(timezone.utc) + timedelta(days=1),
        max_team_size=3,
        created_by=uuid.uuid4(),
        created_at=datetime.now(timezone.utc),
    )

@pytest.fixture
def mock_team():
    return TeamEntity(
        id=uuid.uuid4(),
        challenge_id=uuid.uuid4(),
        name="Test Team",
        leader_id=uuid.uuid4(),
        created_at=datetime.now(timezone.utc),
    )

def test_submit_prediction_success(use_case, mock_repos, mock_challenge, mock_team):
    # Arrange
    user_id = uuid.uuid4()
    file_bytes = b"id,prediction\n1,1\n2,0\n"
    
    mock_repos["team_repo"].get_by_challenge_and_user.return_value = mock_team
    mock_repos["challenge_repo"].get_by_id.return_value = mock_challenge
    mock_repos["submission_repo"].get_last_submission_time.return_value = None
    mock_repos["submission_repo"].exists_by_hash.return_value = False
    
    saved_entity = SubmissionEntity(
        id=uuid.uuid4(),
        challenge_id=mock_challenge.id,
        team_id=mock_team.id,
        submitted_by=user_id,
        file_url="test/url",
        file_md5_hash="hash",
        file_size_bytes=100,
        status=SubmissionStatus.PENDING,
        submitted_at=datetime.now(timezone.utc)
    )
    mock_repos["submission_repo"].save.return_value = saved_entity

    # Act
    result = use_case.submit_prediction(
        challenge_id=mock_challenge.id,
        user_id=user_id,
        file_bytes=file_bytes,
        filename="sub.csv",
        content_type="text/csv"
    )

    # Assert
    assert result.submission_id == saved_entity.id
    assert result.status == SubmissionStatus.PENDING
    mock_repos["storage_repo"].upload.assert_called_once()
    mock_repos["submission_repo"].save.assert_called_once()

def test_submit_prediction_rate_limit(use_case, mock_repos, mock_challenge, mock_team):
    # Arrange
    user_id = uuid.uuid4()
    file_bytes = b"id,prediction\n1,1\n"
    
    mock_repos["team_repo"].get_by_challenge_and_user.return_value = mock_team
    mock_repos["challenge_repo"].get_by_id.return_value = mock_challenge
    # Last submission was 1 minute ago, limit is 5 mins
    mock_repos["submission_repo"].get_last_submission_time.return_value = datetime.now(timezone.utc) - timedelta(minutes=1)

    # Act & Assert
    with pytest.raises(RateLimitExceededError):
        use_case.submit_prediction(
            challenge_id=mock_challenge.id,
            user_id=user_id,
            file_bytes=file_bytes,
            filename="sub.csv",
            content_type="text/csv"
        )

def test_submit_prediction_duplicate_hash(use_case, mock_repos, mock_challenge, mock_team):
    # Arrange
    user_id = uuid.uuid4()
    file_bytes = b"id,prediction\n1,1\n"
    
    mock_repos["team_repo"].get_by_challenge_and_user.return_value = mock_team
    mock_repos["challenge_repo"].get_by_id.return_value = mock_challenge
    mock_repos["submission_repo"].get_last_submission_time.return_value = None
    mock_repos["submission_repo"].exists_by_hash.return_value = True

    # Act & Assert
    with pytest.raises(DuplicateSubmissionError):
        use_case.submit_prediction(
            challenge_id=mock_challenge.id,
            user_id=user_id,
            file_bytes=file_bytes,
            filename="sub.csv",
            content_type="text/csv"
        )

def test_submit_prediction_file_too_large(use_case, mock_repos, mock_challenge, mock_team):
    # Arrange
    user_id = uuid.uuid4()
    # Mock file size 11 MB > 10 MB limit
    file_bytes = b"0" * (11 * 1024 * 1024)
    
    mock_repos["team_repo"].get_by_challenge_and_user.return_value = mock_team
    mock_repos["challenge_repo"].get_by_id.return_value = mock_challenge
    mock_repos["submission_repo"].get_last_submission_time.return_value = None
    mock_repos["submission_repo"].exists_by_hash.return_value = False

    # Act & Assert
    with pytest.raises(FileSizeExceededError):
        use_case.submit_prediction(
            challenge_id=mock_challenge.id,
            user_id=user_id,
            file_bytes=file_bytes,
            filename="sub.csv",
            content_type="text/csv"
        )

def test_trigger_scoring(use_case, mock_repos):
    submission_id = str(uuid.uuid4())
    mock_sub = MagicMock()
    mock_sub.challenge_id = uuid.uuid4()
    mock_repos["submission_repo"].get_by_id.return_value = mock_sub
    mock_challenge = MagicMock()
    mock_challenge.require_gpu = True
    mock_repos["challenge_repo"].get_by_id.return_value = mock_challenge
    use_case.trigger_scoring(submission_id)
    mock_repos["message_broker"].enqueue_scoring_task.assert_called_once_with(submission_id, require_gpu=True)

def test_submit_prediction_no_team(use_case, mock_repos, mock_challenge):
    mock_repos["team_repo"].get_by_challenge_and_user.return_value = None
    with pytest.raises(PermissionDeniedError):
        use_case.submit_prediction(
            challenge_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            file_bytes=b"1,1",
            filename="sub.csv",
            content_type="text/csv"
        )

def test_submit_prediction_no_challenge(use_case, mock_repos, mock_team):
    mock_repos["team_repo"].get_by_challenge_and_user.return_value = mock_team
    mock_repos["challenge_repo"].get_by_id.return_value = None
    with pytest.raises(NotFoundError):
        use_case.submit_prediction(
            challenge_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            file_bytes=b"1,1",
            filename="sub.csv",
            content_type="text/csv"
        )

def test_submit_prediction_empty_file(use_case, mock_repos, mock_challenge, mock_team):
    mock_repos["team_repo"].get_by_challenge_and_user.return_value = mock_team
    mock_repos["challenge_repo"].get_by_id.return_value = mock_challenge
    mock_repos["submission_repo"].get_last_submission_time.return_value = None
    mock_repos["submission_repo"].exists_by_hash.return_value = False
    with pytest.raises(ValueError, match="File CSV rỗng"):
        use_case.submit_prediction(
            challenge_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            file_bytes=b"",
            filename="sub.csv",
            content_type="text/csv"
        )

def test_submit_prediction_challenge_closed(use_case, mock_repos, mock_challenge, mock_team):
    mock_challenge.status = ChallengeStatus.ARCHIVED
    mock_repos["team_repo"].get_by_challenge_and_user.return_value = mock_team
    mock_repos["challenge_repo"].get_by_id.return_value = mock_challenge
    mock_repos["submission_repo"].get_last_submission_time.return_value = None
    with pytest.raises(SubmissionDeadlinePassedError):
        use_case.submit_prediction(
            challenge_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            file_bytes=b"1,1",
            filename="sub.csv",
            content_type="text/csv"
        )

def test_submit_prediction_redis_failure(use_case, mock_repos, mock_challenge, mock_team):
    mock_repos['team_repo'].get_by_challenge_and_user.return_value = mock_team
    mock_repos['challenge_repo'].get_by_id.return_value = mock_challenge
    mock_repos['submission_repo'].get_last_submission_time.return_value = None
    mock_repos['submission_repo'].exists_by_hash.return_value = False
    mock_repos['submission_repo'].save.side_effect = lambda e: e
    mock_repos['message_broker'].enqueue_scoring_task.side_effect = Exception('Redis Down')
    result = use_case.submit_prediction(
        challenge_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        file_bytes=b'1,1\n2,2',
        filename='sub.csv',
        content_type='text/csv'
    )
    assert result.submission_id is not None

def test_select_for_private_success(use_case, mock_repos, mock_challenge, mock_team):
    sub_id = uuid.uuid4()
    mock_sub = MagicMock()
    mock_sub.team_id = mock_team.id
    mock_sub.challenge_id = mock_challenge.id
    mock_repos['submission_repo'].get_by_id.return_value = mock_sub
    mock_repos['team_repo'].get_by_id.return_value = mock_team
    mock_team.has_member = MagicMock(return_value=True)
    mock_repos['challenge_repo'].get_by_id.return_value = mock_challenge
    mock_challenge.end_time = datetime.now(timezone.utc) + timedelta(days=1)
    res = use_case.select_for_private(sub_id, uuid.uuid4())
    assert res.is_selected_for_private is True

def test_select_for_private_not_found(use_case, mock_repos):
    mock_repos['submission_repo'].get_by_id.return_value = None
    with pytest.raises(NotFoundError):
        use_case.select_for_private(uuid.uuid4(), uuid.uuid4())

def test_select_for_private_not_member(use_case, mock_repos, mock_team):
    mock_sub = MagicMock()
    mock_sub.team_id = mock_team.id
    mock_repos['submission_repo'].get_by_id.return_value = mock_sub
    mock_repos['team_repo'].get_by_id.return_value = mock_team
    mock_team.has_member = MagicMock(return_value=False)
    with pytest.raises(PermissionDeniedError):
        use_case.select_for_private(uuid.uuid4(), uuid.uuid4())

def test_select_for_private_deadline_passed(use_case, mock_repos, mock_challenge, mock_team):
    mock_sub = MagicMock()
    mock_sub.team_id = mock_team.id
    mock_sub.challenge_id = mock_challenge.id
    mock_repos['submission_repo'].get_by_id.return_value = mock_sub
    mock_repos['team_repo'].get_by_id.return_value = mock_team
    mock_team.has_member = MagicMock(return_value=True)
    mock_repos['challenge_repo'].get_by_id.return_value = mock_challenge
    mock_challenge.end_time = datetime.now(timezone.utc) - timedelta(days=1)
    with pytest.raises(SubmissionDeadlinePassedError):
        use_case.select_for_private(uuid.uuid4(), uuid.uuid4())

def test_upload_source_code_success(use_case, mock_repos, mock_challenge, mock_team):
    sub_id = uuid.uuid4()
    mock_sub = MagicMock()
    mock_sub.team_id = mock_team.id
    mock_sub.challenge_id = mock_challenge.id
    mock_repos['submission_repo'].get_by_id.return_value = mock_sub
    mock_repos['team_repo'].get_by_id.return_value = mock_team
    mock_team.has_member = MagicMock(return_value=True)
    mock_repos['challenge_repo'].get_by_id.return_value = mock_challenge
    mock_challenge.end_time = datetime.now(timezone.utc) - timedelta(days=1)
    mock_repos['storage_repo'].upload.return_value = 'http://s3/file.zip'
    res = use_case.upload_source_code(sub_id, uuid.uuid4(), [('file.zip', b'abc', 'application/zip')])
    assert res.message == "Upload source code thành công."

def test_upload_source_code_not_found(use_case, mock_repos):
    mock_repos['submission_repo'].get_by_id.return_value = None
    with pytest.raises(NotFoundError):
        use_case.upload_source_code(uuid.uuid4(), uuid.uuid4(), [('file.zip', b'abc', 'application/zip')])

def test_list_team_submissions_success(use_case, mock_repos, mock_team):
    mock_repos['team_repo'].get_by_challenge_and_user.return_value = mock_team
    from app.domain.entities.entities import SubmissionEntity, SubmissionStatus
    mock_sub = SubmissionEntity(
        id=uuid.uuid4(),
        challenge_id=uuid.uuid4(),
        team_id=mock_team.id,
        submitted_by=uuid.uuid4(),
        file_md5_hash="hash",
        file_size_bytes=10,
        status=SubmissionStatus.PENDING,
        submitted_at=datetime.now(timezone.utc)
    )
    mock_repos['submission_repo'].list_by_team.return_value = ([mock_sub], 1)
    res = use_case.list_team_submissions(uuid.uuid4(), uuid.uuid4(), 1, 10)
    assert res.total == 1
    assert len(res.items) == 1

def test_list_team_submissions_no_team(use_case, mock_repos):
    mock_repos['team_repo'].get_by_challenge_and_user.return_value = None
    with pytest.raises(PermissionDeniedError):
        use_case.list_team_submissions(uuid.uuid4(), uuid.uuid4(), 1, 10)

def test_validate_csv_format_invalid_extension():
    from app.application.utils.file_validation import validate_csv_format
    with pytest.raises(ValueError, match="Chỉ chấp nhận file định dạng .csv"):
        validate_csv_format(b'a,b\n1,2', 'test.txt')

def test_validate_csv_format_not_enough_rows():
    from app.application.utils.file_validation import validate_csv_format
    with pytest.raises(ValueError, match="File CSV cần có ít nhất 1 dòng"):
        validate_csv_format(b'header', 'test.csv')

def test_select_for_private_unlimited_time(use_case, mock_repos, mock_team, mock_challenge):
    import uuid
    sub_id = uuid.uuid4()
    mock_sub = MagicMock()
    mock_sub.team_id = mock_team.id
    mock_sub.challenge_id = mock_challenge.id
    mock_repos['submission_repo'].get_by_id.return_value = mock_sub
    mock_repos['team_repo'].get_by_id.return_value = mock_team
    mock_team.has_member = MagicMock(return_value=True)
    mock_repos['challenge_repo'].get_by_id.return_value = mock_challenge
    mock_challenge.end_time = None
    
    res = use_case.select_for_private(sub_id, uuid.uuid4())
    assert res.is_selected_for_private is True

def test_upload_source_code_unlimited_time_raises_error(use_case, mock_repos, mock_team, mock_challenge):
    import uuid
    sub_id = uuid.uuid4()
    mock_sub = MagicMock()
    mock_sub.team_id = mock_team.id
    mock_sub.challenge_id = mock_challenge.id
    mock_repos['submission_repo'].get_by_id.return_value = mock_sub
    mock_repos['team_repo'].get_by_id.return_value = mock_team
    mock_team.has_member = MagicMock(return_value=True)
    mock_repos['challenge_repo'].get_by_id.return_value = mock_challenge
    mock_challenge.end_time = None
    
    with pytest.raises(PermissionDeniedError, match='Challenge không giới hạn thời gian không hỗ trợ nộp Source Code.'):
        use_case.upload_source_code(sub_id, uuid.uuid4(), [('file.zip', b'abc', 'application/zip')])
