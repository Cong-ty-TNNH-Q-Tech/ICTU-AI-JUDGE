import uuid
from unittest.mock import MagicMock
import pytest
from datetime import datetime, timezone, timedelta

from app.application.use_cases.leaderboard_use_case import LeaderboardUseCase
from app.application.dtos.leaderboard_dtos import LeaderboardType
from app.domain.entities.entities import MetricDirection, LeaderboardEntryEntity, ChallengeType, ChallengeStatus

@pytest.fixture
def leaderboard_use_case():
    lb_repo = MagicMock()
    ch_repo = MagicMock()
    team_repo = MagicMock()
    return LeaderboardUseCase(lb_repo, ch_repo, team_repo)

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
    assert res.total == 1
    assert len(res.items) == 1
    assert res.items[0].team_name == "Team 1"
    assert res.items[0].entries == 0

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
    assert res.total == 1
    assert res.items[0].best_private_score == 0.9
    assert res.items[0].entries == 0

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

def test_get_private_leaderboard_unlimited_time_raises_error(leaderboard_use_case):
    import uuid
    mock_challenge = MagicMock()
    mock_challenge.end_time = None
    leaderboard_use_case.challenge_repo.get_by_id.return_value = mock_challenge
    
    with pytest.raises(PermissionError, match='Challenge không giới hạn thời gian không hỗ trợ Private Leaderboard.'):
        leaderboard_use_case.get_leaderboard(uuid.uuid4(), LeaderboardType.PRIVATE, 1, 10, datetime.now(timezone.utc))

def test_get_contest_leaderboard_success(leaderboard_use_case):
    contest = MagicMock()
    contest.metric_direction = MetricDirection.HIGHER_IS_BETTER
    leaderboard_use_case.challenge_repo.get_by_id.return_value = contest
    
    child1 = MagicMock()
    child1.id = uuid.uuid4()
    child1.title = "Child 1"
    child1.description = "Desc"
    child1.type = ChallengeType.PUBLIC
    child1.status = ChallengeStatus.PUBLISHED
    child1.start_time = datetime.now(timezone.utc)
    child1.end_time = datetime.now(timezone.utc)
    child1.rate_limit_minutes = 10
    child1.max_file_size_mb = 10
    child1.metric_name = "Accuracy"
    child1.metric_direction = MetricDirection.HIGHER_IS_BETTER
    child1.created_by = uuid.uuid4()
    child1.created_at = datetime.now(timezone.utc)
    child1.dataset_url = ""
    child1.team_lock_deadline = datetime.now(timezone.utc)
    child1.max_team_size = 3
    child1.parent_id = uuid.uuid4()
    child1.tags = []
    child1.environment_image = "python:3.11-slim"
    child1.require_gpu = False
    
    leaderboard_use_case.challenge_repo.get_children.return_value = [child1]
    
    team = MagicMock()
    team.id = uuid.uuid4()
    team.name = "Test Team"
    leaderboard_use_case.team_repo.get_teams_by_challenges.return_value = [team]
    
    entry = LeaderboardEntryEntity(
        id=uuid.uuid4(),
        challenge_id=child1.id,
        team_id=team.id,
        best_public_score=0.9,
        last_submission_time=datetime.now(timezone.utc),
        rank=1
    )
    leaderboard_use_case.leaderboard_repo.get_by_challenges.return_value = [entry]
    
    res = leaderboard_use_case.get_contest_leaderboard(
        uuid.uuid4(), LeaderboardType.PUBLIC, datetime.now(timezone.utc)
    )
    assert res.leaderboard[0].total_score == 0.9
    assert res.leaderboard[0].team_name == "Test Team"


def test_get_contest_leaderboard_not_found(leaderboard_use_case):
    leaderboard_use_case.challenge_repo.get_by_id.return_value = None
    with pytest.raises(ValueError, match="not found"):
        leaderboard_use_case.get_contest_leaderboard(
            uuid.uuid4(), LeaderboardType.PUBLIC, datetime.now(timezone.utc)
        )


def test_get_contest_leaderboard_private_not_ended(leaderboard_use_case):
    contest = MagicMock()
    now = datetime.now(tz=timezone.utc)
    contest.end_time = now + timedelta(days=1)
    leaderboard_use_case.challenge_repo.get_by_id.return_value = contest
    
    with pytest.raises(PermissionError, match="only available after contest ends"):
        leaderboard_use_case.get_contest_leaderboard(
            uuid.uuid4(), LeaderboardType.PRIVATE, now
        )

def test_get_contest_leaderboard_private_unlimited_time(leaderboard_use_case):
    contest = MagicMock()
    contest.end_time = None
    leaderboard_use_case.challenge_repo.get_by_id.return_value = contest
    with pytest.raises(PermissionError, match="không giới hạn thời gian"):
        leaderboard_use_case.get_contest_leaderboard(
            uuid.uuid4(), LeaderboardType.PRIVATE, datetime.now(timezone.utc)
        )
