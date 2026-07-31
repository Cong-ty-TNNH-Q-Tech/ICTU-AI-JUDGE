import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest

from app.application.use_cases.team_use_case import TeamUseCase
from app.domain.entities.entities import ChallengeEntity, ChallengeStatus, ChallengeType, TeamInviteEntity, InviteStatus, MetricDirection, TeamEntity, UserEntity
from app.domain.exceptions.exceptions import InvalidTokenError, NotFoundError, PermissionDeniedError, TeamAlreadyLockedError, TeamFullError, UserAlreadyInTeamError

@pytest.fixture
def mock_repos():
    return {
        "team_repo": MagicMock(),
        "challenge_repo": MagicMock(),
        "user_repo": MagicMock(),
        "uow": MagicMock(),
    }

@pytest.fixture
def use_case(mock_repos):
    return TeamUseCase(**mock_repos)

@pytest.fixture
def mock_user():
    return UserEntity(
        id=uuid.uuid4(),
        email="test@example.com",
        full_name="Test User",
        student_id="DTC123",
        role="STUDENT",
        password_hash="hash",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

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
def mock_team(mock_challenge, mock_user):
    return TeamEntity(
        id=uuid.uuid4(),
        name="Team",
        challenge_id=mock_challenge.id,
        leader_id=mock_user.id,
        created_at=datetime.now(timezone.utc),
        member_ids=[mock_user.id]
    )


def test_create_invite_success(use_case, mock_repos, mock_team, mock_challenge, mock_user):
    mock_repos["team_repo"].get_by_id.return_value = mock_team
    mock_repos["challenge_repo"].get_by_id.return_value = mock_challenge

    result = use_case.create_invite(mock_team.id, mock_user.id, "http://test")

    assert result.token is not None
    assert "join?token=" in result.invite_url
    mock_repos["team_repo"].invalidate_invites.assert_called_once_with(mock_team.id)
    mock_repos["team_repo"].create_invite.assert_called_once()
    mock_repos["uow"].commit.assert_called_once()


def test_create_invite_not_leader(use_case, mock_repos, mock_team):
    mock_repos["team_repo"].get_by_id.return_value = mock_team
    
    with pytest.raises(PermissionDeniedError):
        use_case.create_invite(mock_team.id, uuid.uuid4(), "http://test")


def test_create_invite_team_locked(use_case, mock_repos, mock_team, mock_challenge, mock_user):
    mock_challenge.team_lock_deadline = datetime.now(timezone.utc) - timedelta(days=1)
    mock_repos["team_repo"].get_by_id.return_value = mock_team
    mock_repos["challenge_repo"].get_by_id.return_value = mock_challenge

    with pytest.raises(TeamAlreadyLockedError):
        use_case.create_invite(mock_team.id, mock_user.id, "http://test")


def test_join_team_success_no_existing_team(use_case, mock_repos, mock_team, mock_challenge):
    mock_invite = TeamInviteEntity(
        id=uuid.uuid4(),
        team_id=mock_team.id,
        inviter_id=mock_team.leader_id,
        invitee_email="",
        token="token",
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        status=InviteStatus.PENDING,
        created_at=datetime.now(timezone.utc)
    )
    mock_repos["team_repo"].get_invite_by_token.return_value = mock_invite
    mock_repos["team_repo"].get_by_id.return_value = mock_team
    mock_repos["challenge_repo"].get_by_id.return_value = mock_challenge
    mock_repos["team_repo"].get_by_challenge_and_user.return_value = None

    result = use_case.join_team(uuid.uuid4(), "token")

    assert result.id == mock_team.id
    mock_repos["team_repo"].add_member.assert_called_once()
    mock_repos["uow"].commit.assert_called_once()


def test_join_team_success_delete_default_team(use_case, mock_repos, mock_team, mock_challenge):
    user_id = uuid.uuid4()
    mock_invite = TeamInviteEntity(
        id=uuid.uuid4(),
        team_id=mock_team.id,
        inviter_id=mock_team.leader_id,
        invitee_email="",
        token="token",
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        status=InviteStatus.PENDING,
        created_at=datetime.now(timezone.utc)
    )
    
    default_team = TeamEntity(
        id=uuid.uuid4(),
        name="Default",
        challenge_id=mock_challenge.id,
        leader_id=user_id,
        created_at=datetime.now(timezone.utc),
        member_ids=[user_id]
    )
    
    mock_repos["team_repo"].get_invite_by_token.return_value = mock_invite
    mock_repos["team_repo"].get_by_id.return_value = mock_team
    mock_repos["challenge_repo"].get_by_id.return_value = mock_challenge
    mock_repos["team_repo"].get_by_challenge_and_user.return_value = default_team
    mock_repos["team_repo"].has_submissions.return_value = False

    result = use_case.join_team(user_id, "token")

    mock_repos["team_repo"].delete.assert_called_once_with(default_team.id)
    mock_repos["team_repo"].add_member.assert_called_once_with(mock_team.id, user_id)
    mock_repos["uow"].commit.assert_called_once()


def test_join_team_fail_existing_team_multiple_members(use_case, mock_repos, mock_team, mock_challenge):
    user_id = uuid.uuid4()
    mock_invite = TeamInviteEntity(
        id=uuid.uuid4(),
        team_id=mock_team.id,
        inviter_id=mock_team.leader_id,
        invitee_email="",
        token="token",
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        status=InviteStatus.PENDING,
        created_at=datetime.now(timezone.utc)
    )
    
    existing_team = TeamEntity(
        id=uuid.uuid4(),
        name="Existing",
        challenge_id=mock_challenge.id,
        leader_id=user_id,
        created_at=datetime.now(timezone.utc),
        member_ids=[user_id, uuid.uuid4()]
    )
    
    mock_repos["team_repo"].get_invite_by_token.return_value = mock_invite
    mock_repos["team_repo"].get_by_id.return_value = mock_team
    mock_repos["challenge_repo"].get_by_id.return_value = mock_challenge
    mock_repos["team_repo"].get_by_challenge_and_user.return_value = existing_team

    with pytest.raises(UserAlreadyInTeamError, match="thuộc một đội khác"):
        use_case.join_team(user_id, "token")


def test_join_team_fail_existing_team_has_submissions(use_case, mock_repos, mock_team, mock_challenge):
    user_id = uuid.uuid4()
    mock_invite = TeamInviteEntity(
        id=uuid.uuid4(),
        team_id=mock_team.id,
        inviter_id=mock_team.leader_id,
        invitee_email="",
        token="token",
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        status=InviteStatus.PENDING,
        created_at=datetime.now(timezone.utc)
    )
    
    default_team = TeamEntity(
        id=uuid.uuid4(),
        name="Default",
        challenge_id=mock_challenge.id,
        leader_id=user_id,
        created_at=datetime.now(timezone.utc),
        member_ids=[user_id]
    )
    
    mock_repos["team_repo"].get_invite_by_token.return_value = mock_invite
    mock_repos["team_repo"].get_by_id.return_value = mock_team
    mock_repos["challenge_repo"].get_by_id.return_value = mock_challenge
    mock_repos["team_repo"].get_by_challenge_and_user.return_value = default_team
    mock_repos["team_repo"].has_submissions.return_value = True

    with pytest.raises(UserAlreadyInTeamError, match="đã nộp bài"):
        use_case.join_team(user_id, "token")


def test_auto_create_team_success(use_case, mock_repos, mock_challenge, mock_user, mock_team):
    mock_repos["challenge_repo"].get_by_id.return_value = mock_challenge
    mock_repos["team_repo"].get_by_challenge_and_user.return_value = None
    mock_repos["user_repo"].get_by_id.return_value = mock_user
    mock_repos["team_repo"].get_by_id.return_value = mock_team

    use_case.auto_create_team_if_not_exists(mock_user.id, mock_challenge.id)

    mock_repos["team_repo"].save.assert_called_once()
    mock_repos["team_repo"].add_member.assert_called_once()
    mock_repos["uow"].commit.assert_called_once()


def test_create_invite_when_old_invite_expired(use_case, mock_repos, mock_team, mock_challenge, mock_user):
    """
    Test kịch bản khi tạo lời mời thứ hai nhưng lời mời cũ đã chuyển sang EXPIRED (Issue #98).
    """
    mock_repos["team_repo"].get_by_id.return_value = mock_team
    mock_repos["challenge_repo"].get_by_id.return_value = mock_challenge

    result = use_case.create_invite(mock_team.id, mock_user.id, "http://test")

    assert result.token is not None
    assert "join?token=" in result.invite_url
    mock_repos["team_repo"].invalidate_invites.assert_called_once_with(mock_team.id)
    mock_repos["team_repo"].create_invite.assert_called_once()
    mock_repos["uow"].commit.assert_called_once()
