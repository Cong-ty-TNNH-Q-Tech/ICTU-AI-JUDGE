from unittest.mock import MagicMock
import pytest
import uuid
from datetime import datetime

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
        start_time=datetime.now(),
        end_time=datetime.now(),
        rate_limit_minutes=60,
        max_file_size_mb=10,
        metric_name="Accuracy",
        metric_direction=MetricDirection.HIGHER_IS_BETTER,
        created_by=uuid.uuid4(),
        max_team_size=1,
        created_at=datetime.now(),
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
        start_time=datetime.now(),
        end_time=datetime.now(),
        rate_limit_minutes=10,
        max_file_size_mb=5,
        metric_name="F1",
        metric_direction=MetricDirection.HIGHER_IS_BETTER,
        max_team_size=3,
        team_lock_deadline=datetime.now(),
        tag_ids=[uuid.uuid4()]
    )
    from app.domain.entities.entities import TagEntity
    tag = TagEntity(
        id=uuid.uuid4(),
        name="NLP",
        color_hex="#ffffff",
        created_at=datetime.now()
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

