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
        created_at=datetime.now()
    )

@pytest.fixture
def challenge_use_case():
    repo = MagicMock()
    storage_repo = MagicMock()
    return ChallengeUseCase(challenge_repo=repo, storage_repo=storage_repo)

def test_list_challenges(challenge_use_case, dummy_challenge):
    challenge_use_case.challenge_repo.list_all.return_value = ([dummy_challenge], 1)
    
    res = challenge_use_case.list_challenges(page=1, size=10, status_filter="PUBLISHED", is_admin=False)
    assert res.total == 1
    assert len(res.items) == 1
    assert res.items[0].title == "Test Challenge"
    challenge_use_case.challenge_repo.list_all.assert_called_once_with(page=1, size=10, status_filter="PUBLISHED")

def test_get_challenge(challenge_use_case, dummy_challenge):
    cid = dummy_challenge.id
    challenge_use_case.challenge_repo.get_by_id.return_value = dummy_challenge
    
    res = challenge_use_case.get_challenge(cid, is_admin=False)
    assert res.title == "Test Challenge"
    challenge_use_case.challenge_repo.get_by_id.assert_called_once_with(cid)
