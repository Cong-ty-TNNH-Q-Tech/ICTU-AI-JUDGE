"""
Tests for ContestUseCase — Issue #123: Contest Entity System.
Kiến trúc: Mock IContestRepository + IUnitOfWork, không cần DB thật.
"""
from unittest.mock import MagicMock, patch
import pytest
import uuid
from datetime import datetime, timezone

from app.application.use_cases.contest_use_case import ContestUseCase
from app.application.dtos.contest_dtos import ContestCreateDTO, ContestUpdateDTO
from app.domain.entities.entities import (
    ChallengeEntity,
    ChallengeStatus,
    ChallengeType,
    ContestEntity,
    ContestStatus,
    MetricDirection,
)
from app.domain.exceptions.exceptions import NotFoundError


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def now():
    return datetime.now(timezone.utc)


@pytest.fixture
def admin_id():
    return uuid.uuid4()


@pytest.fixture
def dummy_contest(now, admin_id):
    return ContestEntity(
        id=uuid.uuid4(),
        title="ICTU AI Challenge 2026",
        description="Cuộc thi AI lớn nhất năm",
        status=ContestStatus.DRAFT,
        start_time=now,
        end_time=None,
        created_by=admin_id,
        created_at=now,
    )


@pytest.fixture
def dummy_challenge(now, admin_id):
    return ChallengeEntity(
        id=uuid.uuid4(),
        title="Bài thi phân loại ảnh",
        description="Phân loại ảnh bằng CNN",
        type=ChallengeType.PUBLIC,
        status=ChallengeStatus.PUBLISHED,
        start_time=now,
        end_time=None,
        rate_limit_minutes=10,
        max_team_size=5,
        max_file_size_mb=50,
        metric_name="accuracy",
        metric_direction=MetricDirection.HIGHER_IS_BETTER,
        created_by=admin_id,
        created_at=now,
    )


@pytest.fixture
def contest_use_case():
    repo = MagicMock()
    uow = MagicMock()
    return ContestUseCase(contest_repo=repo, uow=uow)


# ---------------------------------------------------------------------------
# get_list
# ---------------------------------------------------------------------------

def test_get_list_returns_paginated(contest_use_case, dummy_contest):
    contest_use_case._contest_repo.get_list.return_value = ([dummy_contest], 1)

    result = contest_use_case.get_list(page=1, size=10)

    assert result.total == 1
    assert result.page == 1
    assert result.size == 10
    assert result.total_pages == 1
    assert len(result.items) == 1
    assert result.items[0].title == "ICTU AI Challenge 2026"


def test_get_list_empty(contest_use_case):
    contest_use_case._contest_repo.get_list.return_value = ([], 0)

    result = contest_use_case.get_list(page=1, size=10)

    assert result.total == 0
    assert result.total_pages == 0
    assert result.items == []


def test_get_list_pagination_calculation(contest_use_case, dummy_contest):
    # 25 items, size=10 → 3 pages
    contests = [dummy_contest] * 25
    contest_use_case._contest_repo.get_list.return_value = (contests, 25)

    result = contest_use_case.get_list(page=1, size=10)

    assert result.total_pages == 3


def test_get_list_with_status_filter(contest_use_case, dummy_contest):
    contest_use_case._contest_repo.get_list.return_value = ([dummy_contest], 1)

    contest_use_case.get_list(page=1, size=10, status="PUBLISHED")

    contest_use_case._contest_repo.get_list.assert_called_once_with(1, 10, "PUBLISHED")


# ---------------------------------------------------------------------------
# get_detail
# ---------------------------------------------------------------------------

def test_get_detail_found(contest_use_case, dummy_contest):
    contest_use_case._contest_repo.get_by_id.return_value = dummy_contest

    result = contest_use_case.get_detail(dummy_contest.id)

    assert result.id == dummy_contest.id
    assert result.title == "ICTU AI Challenge 2026"
    assert result.status == ContestStatus.DRAFT.value


def test_get_detail_not_found(contest_use_case):
    contest_use_case._contest_repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError, match="không tồn tại"):
        contest_use_case.get_detail(uuid.uuid4())


# ---------------------------------------------------------------------------
# get_challenges
# ---------------------------------------------------------------------------

def test_get_challenges_returns_list(contest_use_case, dummy_contest, dummy_challenge):
    contest_use_case._contest_repo.get_by_id.return_value = dummy_contest
    contest_use_case._contest_repo.get_challenges.return_value = [dummy_challenge]

    result = contest_use_case.get_challenges(dummy_contest.id)

    assert result.total == 1
    assert result.contest_id == dummy_contest.id
    assert len(result.items) == 1
    assert result.items[0].title == "Bài thi phân loại ảnh"


def test_get_challenges_contest_not_found(contest_use_case):
    contest_use_case._contest_repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        contest_use_case.get_challenges(uuid.uuid4())


def test_get_challenges_empty(contest_use_case, dummy_contest):
    contest_use_case._contest_repo.get_by_id.return_value = dummy_contest
    contest_use_case._contest_repo.get_challenges.return_value = []

    result = contest_use_case.get_challenges(dummy_contest.id)

    assert result.total == 0
    assert result.items == []


# ---------------------------------------------------------------------------
# create
# ---------------------------------------------------------------------------

def test_create_contest(contest_use_case, dummy_contest, admin_id, now):
    dto = ContestCreateDTO(
        title="ICTU AI Challenge 2026",
        description="Cuộc thi AI lớn nhất năm",
        status=ContestStatus.DRAFT,
        start_time=now,
        end_time=None,
    )
    contest_use_case._contest_repo.save.return_value = dummy_contest

    result = contest_use_case.create(dto, admin_id)

    contest_use_case._contest_repo.save.assert_called_once()
    contest_use_case._uow.commit.assert_called_once()
    assert result.title == "ICTU AI Challenge 2026"
    assert result.status == ContestStatus.DRAFT.value


def test_create_contest_saves_correct_entity(contest_use_case, dummy_contest, admin_id, now):
    dto = ContestCreateDTO(
        title="New Contest",
        description="Desc",
        status=ContestStatus.PUBLISHED,
        start_time=now,
    )
    contest_use_case._contest_repo.save.return_value = dummy_contest

    contest_use_case.create(dto, admin_id)

    saved_entity: ContestEntity = contest_use_case._contest_repo.save.call_args[0][0]
    assert saved_entity.title == "New Contest"
    assert saved_entity.status == ContestStatus.PUBLISHED
    assert saved_entity.created_by == admin_id


# ---------------------------------------------------------------------------
# update
# ---------------------------------------------------------------------------

def test_update_contest_title(contest_use_case, dummy_contest):
    contest_use_case._contest_repo.get_by_id.return_value = dummy_contest
    updated = ContestEntity(**{**dummy_contest.__dict__, "title": "Updated Title"})
    contest_use_case._contest_repo.save.return_value = updated

    dto = ContestUpdateDTO(title="Updated Title")
    result = contest_use_case.update(dummy_contest.id, dto)

    assert result.title == "Updated Title"
    contest_use_case._uow.commit.assert_called_once()


def test_update_contest_status(contest_use_case, dummy_contest):
    contest_use_case._contest_repo.get_by_id.return_value = dummy_contest
    updated = ContestEntity(**{**dummy_contest.__dict__, "status": ContestStatus.PUBLISHED})
    contest_use_case._contest_repo.save.return_value = updated

    dto = ContestUpdateDTO(status=ContestStatus.PUBLISHED)
    result = contest_use_case.update(dummy_contest.id, dto)

    assert result.status == ContestStatus.PUBLISHED.value


def test_update_contest_not_found(contest_use_case):
    contest_use_case._contest_repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError, match="không tồn tại"):
        contest_use_case.update(uuid.uuid4(), ContestUpdateDTO(title="X"))


def test_update_partial_fields_unchanged(contest_use_case, dummy_contest):
    """Chỉ update description — title không thay đổi."""
    contest_use_case._contest_repo.get_by_id.return_value = dummy_contest
    contest_use_case._contest_repo.save.return_value = dummy_contest

    dto = ContestUpdateDTO(description="Mô tả mới")
    contest_use_case.update(dummy_contest.id, dto)

    saved: ContestEntity = contest_use_case._contest_repo.save.call_args[0][0]
    assert saved.title == "ICTU AI Challenge 2026"  # Không đổi
    assert saved.description == "Mô tả mới"


# ---------------------------------------------------------------------------
# delete
# ---------------------------------------------------------------------------

def test_delete_contest(contest_use_case, dummy_contest):
    contest_use_case._contest_repo.get_by_id.return_value = dummy_contest

    contest_use_case.delete(dummy_contest.id)

    contest_use_case._contest_repo.delete.assert_called_once_with(dummy_contest.id)
    contest_use_case._uow.commit.assert_called_once()


def test_delete_contest_not_found(contest_use_case):
    contest_use_case._contest_repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError, match="không tồn tại"):
        contest_use_case.delete(uuid.uuid4())


def test_delete_does_not_commit_when_not_found(contest_use_case):
    contest_use_case._contest_repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        contest_use_case.delete(uuid.uuid4())

    contest_use_case._uow.commit.assert_not_called()
