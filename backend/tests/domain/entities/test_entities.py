import uuid
from datetime import datetime, timezone, timedelta
import pytest

from app.domain.entities.entities import (
    UserEntity, UserRole,
    ChallengeEntity, ChallengeType, ChallengeStatus, MetricDirection,
    TeamEntity,
    SubmissionEntity, SubmissionStatus,
    LeaderboardEntryEntity,
    SolutionEntity
)

def test_user_entity():
    uid = uuid.uuid4()
    user = UserEntity(
        id=uid,
        email="test@example.com",
        student_id="DTC123",
        full_name="Test User",
        role=UserRole.STUDENT,
        password_hash="hash",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    assert not user.is_admin()
    assert user.is_active()

    user.role = UserRole.ADMIN
    assert user.is_admin()

    user.deleted_at = datetime.now()
    assert not user.is_active()


def test_challenge_entity():
    now = datetime.now(tz=timezone.utc)
    challenge = ChallengeEntity(
        id=uuid.uuid4(),
        title="Test Challenge",
        description="Desc",
        type=ChallengeType.PUBLIC,
        status=ChallengeStatus.PUBLISHED,
        start_time=now - timedelta(days=1),
        end_time=now + timedelta(days=1),
        rate_limit_minutes=10,
        max_file_size_mb=50,
        metric_name="accuracy",
        metric_direction=MetricDirection.HIGHER_IS_BETTER,
        created_by=uuid.uuid4(),
        created_at=now,
    )

    # test is_accepting_submissions
    assert challenge.is_accepting_submissions(now) is True

    # test out of time
    assert challenge.is_accepting_submissions(now + timedelta(days=2)) is False
    assert challenge.is_accepting_submissions(now - timedelta(days=2)) is False

    # test status not published
    challenge.status = ChallengeStatus.DRAFT
    assert challenge.is_accepting_submissions(now) is False
    challenge.status = ChallengeStatus.PUBLISHED

    # test deleted
    challenge.deleted_at = now
    assert challenge.is_accepting_submissions(now) is False
    challenge.deleted_at = None

    # test is_metric_locked
    assert challenge.is_metric_locked() is True
    challenge.status = ChallengeStatus.DRAFT
    assert challenge.is_metric_locked() is False

    # test team lock
    assert challenge.is_team_locked(now) is False
    challenge.team_lock_deadline = now - timedelta(hours=1)
    assert challenge.is_team_locked(now) is True
    challenge.team_lock_deadline = now + timedelta(hours=1)
    assert challenge.is_team_locked(now) is False


def test_team_entity():
    uid1 = uuid.uuid4()
    uid2 = uuid.uuid4()
    team = TeamEntity(
        id=uuid.uuid4(),
        name="Team 1",
        challenge_id=uuid.uuid4(),
        leader_id=uid1,
        created_at=datetime.now(),
        member_ids=[uid1]
    )

    assert team.has_member(uid1) is True
    assert team.has_member(uid2) is False

    assert team.is_full(1) is True
    assert team.is_full(2) is False

def test_submission_entity_instantiation():
    sub = SubmissionEntity(
        id=uuid.uuid4(),
        challenge_id=uuid.uuid4(),
        team_id=uuid.uuid4(),
        submitted_by=uuid.uuid4(),
        file_md5_hash="md5",
        file_size_bytes=100,
        status=SubmissionStatus.PENDING,
        submitted_at=datetime.now()
    )
    assert sub.status == SubmissionStatus.PENDING

def test_leaderboard_entry_entity_instantiation():
    lb = LeaderboardEntryEntity(
        id=uuid.uuid4(),
        challenge_id=uuid.uuid4(),
        team_id=uuid.uuid4(),
        best_public_score=0.9,
        last_submission_time=datetime.now(),
        rank=1,
        updated_at=datetime.now()
    )
    assert lb.rank == 1

def test_solution_entity_instantiation():
    sol = SolutionEntity(
        id=uuid.uuid4(),
        challenge_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        title="Title",
        content="Content",
        notebook_url="http://example.com/notebook.ipynb",
        upvotes=10,
        created_at=datetime.now()
    )
    assert sol.upvotes == 10
