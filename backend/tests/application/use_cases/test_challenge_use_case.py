from unittest.mock import MagicMock
import pytest
import uuid
from datetime import datetime, timezone

from app.application.use_cases.challenge_use_case import ChallengeUseCase
from app.domain.entities.entities import ChallengeEntity, ChallengeType, ChallengeStatus, MetricDirection

@pytest.fixture
def dummy_challenge():
    return ChallengeEntity(
        id=uuid.uuid4(),
        title="Test Challenge",
        description="Desc",
        type=ChallengeType.PUBLIC,
        status=ChallengeStatus.DRAFT,
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc),
        rate_limit_minutes=60,
        max_file_size_mb=10,
        metric_name="Accuracy",
        metric_direction=MetricDirection.HIGHER_IS_BETTER,
        created_by=uuid.uuid4(),
        max_team_size=1,
        created_at=datetime.now(timezone.utc),
        tags=[]
    )

@pytest.fixture
def challenge_use_case():
    repo = MagicMock()
    storage_repo = MagicMock()
    tag_repo = MagicMock()
    return ChallengeUseCase(challenge_repo=repo, storage_repo=storage_repo, tag_repo=tag_repo)

def test_list_challenges(challenge_use_case, dummy_challenge):
    challenge_use_case.challenge_repo.list_all.return_value = ([dummy_challenge], 1)
    
    res = challenge_use_case.list_challenges(page=1, size=10, status_filter="PUBLISHED", is_admin=False)
    assert res.total == 1
    assert len(res.items) == 1
    assert res.items[0].title == "Test Challenge"
    challenge_use_case.challenge_repo.list_all.assert_called_once_with(page=1, size=10, status_filter="PUBLISHED", tag_id=None)

def test_get_challenge(challenge_use_case, dummy_challenge):
    cid = dummy_challenge.id
    challenge_use_case.challenge_repo.get_by_id.return_value = dummy_challenge
    
    res = challenge_use_case.get_challenge(cid, is_admin=False)
    assert res.title == "Test Challenge"
    challenge_use_case.challenge_repo.get_by_id.assert_called_once_with(cid)

def test_get_challenge_not_found(challenge_use_case):
    challenge_use_case.challenge_repo.get_by_id.return_value = None
    with pytest.raises(ValueError, match="Bài thi không tồn tại."):
        challenge_use_case.get_challenge(uuid.uuid4())

def test_create_challenge(challenge_use_case):
    from app.application.dtos.challenge_dtos import ChallengeCreateRequestDTO
    dto = ChallengeCreateRequestDTO(
        title="New Challenge",
        description="Desc",
        type=ChallengeType.PUBLIC,
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc),
        rate_limit_minutes=10,
        max_file_size_mb=5,
        metric_name="F1",
        metric_direction=MetricDirection.HIGHER_IS_BETTER,
        max_team_size=3,
        team_lock_deadline=datetime.now(timezone.utc),
        tag_ids=[uuid.uuid4()]
    )
    from app.domain.entities.entities import TagEntity
    tag = TagEntity(
        id=uuid.uuid4(),
        name="NLP",
        color_hex="#ffffff",
        created_at=datetime.now(timezone.utc)
    )
    challenge_use_case.tag_repo.get_by_ids.return_value = [tag]
    challenge_use_case.challenge_repo.save.side_effect = lambda x: x
    
    admin_id = uuid.uuid4()
    res = challenge_use_case.create_challenge(admin_id, dto)
    assert res.title == "New Challenge"
    assert res.created_by == admin_id

def test_update_challenge(challenge_use_case, dummy_challenge):
    from app.application.dtos.challenge_dtos import ChallengeUpdateRequestDTO
    challenge_use_case.challenge_repo.get_by_id.return_value = dummy_challenge
    challenge_use_case.challenge_repo.has_successful_submission.return_value = False
    challenge_use_case.tag_repo.get_by_ids.return_value = []
    challenge_use_case.challenge_repo.update.side_effect = lambda x: x
    
    dto = ChallengeUpdateRequestDTO(title="Updated Title", tag_ids=[])
    res = challenge_use_case.update_challenge(dummy_challenge.id, dto)
    assert res.title == "Updated Title"

def test_delete_challenge(challenge_use_case):
    cid = uuid.uuid4()
    challenge_use_case.delete_challenge(cid)
    challenge_use_case.challenge_repo.soft_delete.assert_called_once_with(cid)

def test_upload_secrets(challenge_use_case, dummy_challenge):
    challenge_use_case.challenge_repo.get_by_id.return_value = dummy_challenge
    challenge_use_case.challenge_repo.has_successful_submission.return_value = False
    challenge_use_case.challenge_repo.update.side_effect = lambda x: x
    
    gt_csv = b"ID,Usage\n1,Public"
    res = challenge_use_case.upload_secrets(dummy_challenge.id, gt_csv, None)
    
    assert "ground_truth" in res.ground_truth_url
    challenge_use_case.storage_repo.upload.assert_called_once()

def test_upload_secrets_missing_usage_auto_generate(challenge_use_case, dummy_challenge):
    challenge_use_case.challenge_repo.get_by_id.return_value = dummy_challenge
    challenge_use_case.challenge_repo.has_successful_submission.return_value = False
    challenge_use_case.challenge_repo.update.side_effect = lambda x: x
    
    gt_csv = b"ID,Target\n1,A\n2,B\n3,C\n4,D\n5,E"
    res = challenge_use_case.upload_secrets(dummy_challenge.id, gt_csv, None, public_test_split_ratio=40)
    
    challenge_use_case.storage_repo.upload.assert_called_once()
    args, kwargs = challenge_use_case.storage_repo.upload.call_args
    uploaded_bytes = kwargs.get('data') or args[1]
    
    content = uploaded_bytes.decode('utf-8').strip().split('\r\n')
    # Because csv writer uses \r\n
    headers = content[0].split(',')
    assert "Usage" in headers
    
    public_count = sum(1 for row in content[1:] if "Public" in row)
    private_count = sum(1 for row in content[1:] if "Private" in row)
    assert public_count == 2
    assert private_count == 3

def test_upload_secrets_empty_csv(challenge_use_case, dummy_challenge):
    challenge_use_case.challenge_repo.get_by_id.return_value = dummy_challenge
    challenge_use_case.challenge_repo.has_successful_submission.return_value = False
    
    gt_csv = b""
    with pytest.raises(ValueError, match="File CSV rỗng."):
        challenge_use_case.upload_secrets(dummy_challenge.id, gt_csv, None)
