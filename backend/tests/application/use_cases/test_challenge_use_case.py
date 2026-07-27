import uuid
from unittest.mock import MagicMock
import pytest

from app.application.use_cases.challenge_use_case import ChallengeUseCase
from app.domain.entities.entities import ChallengeEntity

@pytest.fixture
def challenge_use_case():
    repo = MagicMock()
    return ChallengeUseCase(repo)

def test_list_challenges(challenge_use_case):
    challenge_use_case.challenge_repo.list_all.return_value = (["challenge1"], 1)
    
    res = challenge_use_case.list_challenges(page=1, size=10, status_filter="PUBLISHED")
    assert res["total"] == 1
    assert len(res["items"]) == 1
    assert res["items"][0] == "challenge1"
    challenge_use_case.challenge_repo.list_all.assert_called_once_with(page=1, size=10, status_filter="PUBLISHED")

def test_get_challenge(challenge_use_case):
    cid = uuid.uuid4()
    challenge_use_case.challenge_repo.get_by_id.return_value = "challenge1"
    
    res = challenge_use_case.get_challenge(cid)
    assert res == "challenge1"
    challenge_use_case.challenge_repo.get_by_id.assert_called_once_with(cid)
