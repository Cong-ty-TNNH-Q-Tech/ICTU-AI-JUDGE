import uuid
from unittest.mock import MagicMock
import pytest
from datetime import datetime, timezone, timedelta

from app.application.use_cases.leaderboard_use_case import LeaderboardUseCase
from app.application.dtos.leaderboard_dtos import LeaderboardType
from app.domain.entities.entities import MetricDirection, LeaderboardEntryEntity

@pytest.fixture
def leaderboard_use_case():
    lb_repo = MagicMock()
    ch_repo = MagicMock()
    return LeaderboardUseCase(lb_repo, ch_repo)

def test_get_leaderboard_public(leaderboard_use_case):
    challenge = MagicMock()
    challenge.metric_direction = MetricDirection.HIGHER_IS_BETTER
    leaderboard_use_case.challenge_repo.get_by_id.return_value = challenge
    
    entity = LeaderboardEntryEntity(
        id=uuid.uuid4(),
        challenge_id=uuid.uuid4(),
        team_id=uuid.uuid4(),
        best_public_score=1.0,
        last_submission_time=datetime.now(),
        rank=1,
        updated_at=datetime.now()
    )
    leaderboard_use_case.leaderboard_repo.list_public.return_value = ([(entity, "Team 1")], 1)
    
    res = leaderboard_use_case.get_leaderboard(
        uuid.uuid4(), LeaderboardType.PUBLIC, 1, 10, datetime.now()
    )
    assert res.total_count == 1
    assert len(res.data) == 1
    assert res.data[0].team_name == "Team 1"

def test_get_leaderboard_private_success(leaderboard_use_case):
    challenge = MagicMock()
    challenge.metric_direction = MetricDirection.HIGHER_IS_BETTER
    now = datetime.now(tz=timezone.utc)
    challenge.end_time = now - timedelta(days=1)
    leaderboard_use_case.challenge_repo.get_by_id.return_value = challenge
    
    entity = LeaderboardEntryEntity(
        id=uuid.uuid4(),
        challenge_id=uuid.uuid4(),
        team_id=uuid.uuid4(),
        best_public_score=1.0,
        best_private_score=0.9,
        last_submission_time=datetime.now(),
        rank=1,
        updated_at=datetime.now()
    )
    leaderboard_use_case.leaderboard_repo.list_private.return_value = ([(entity, "Team 1")], 1)
    
    res = leaderboard_use_case.get_leaderboard(
        uuid.uuid4(), LeaderboardType.PRIVATE, 1, 10, now
    )
    assert res.total_count == 1
    assert res.data[0].best_private_score == 0.9

def test_get_leaderboard_private_not_ended(leaderboard_use_case):
    challenge = MagicMock()
    now = datetime.now(tz=timezone.utc)
    challenge.end_time = now + timedelta(days=1)
    leaderboard_use_case.challenge_repo.get_by_id.return_value = challenge
    
    with pytest.raises(PermissionError, match="only available after challenge ends"):
        leaderboard_use_case.get_leaderboard(
            uuid.uuid4(), LeaderboardType.PRIVATE, 1, 10, now
        )

def test_get_leaderboard_not_found(leaderboard_use_case):
    leaderboard_use_case.challenge_repo.get_by_id.return_value = None
    with pytest.raises(ValueError, match="not found"):
        leaderboard_use_case.get_leaderboard(
            uuid.uuid4(), LeaderboardType.PUBLIC, 1, 10, datetime.now()
        )
