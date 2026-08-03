"""
Tests for SQLContestRepository — Issue #142.

Kiểm tra rằng save() truyền đúng Enum instance (ContestStatus)
xuống SQLAlchemy Model, KHÔNG truyền raw string (.value).

Dùng MagicMock cho Session để tránh phụ thuộc vào PostgreSQL PgEnum.
"""
import uuid
import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from app.adapters.database.contest_repository import SQLContestRepository
from app.adapters.database.models import ContestModel
from app.domain.entities.entities import ContestEntity, ContestStatus


@pytest.fixture
def now():
    return datetime.now(timezone.utc)


@pytest.fixture
def admin_id():
    return uuid.uuid4()


@pytest.fixture
def contest_entity(now, admin_id):
    return ContestEntity(
        id=uuid.uuid4(),
        title="ICTU AI Challenge 2026",
        description="Cuoc thi AI",
        status=ContestStatus.DRAFT,
        start_time=now,
        end_time=None,
        created_by=admin_id,
        created_at=now,
    )


# ---------------------------------------------------------------------------
# Bug regression: status phải là Enum instance, KHÔNG phải string
# (Issue #142 — Khả năng A: SQLAlchemy Enum mapping)
# ---------------------------------------------------------------------------

def test_save_new_contest_passes_enum_instance_not_string(contest_entity):
    """
    Khi tạo Contest mới, ContestModel.status PHẢI nhận ContestStatus Enum instance.
    Nếu truyền string 'DRAFT', PgEnum sẽ raise DataError khi flush → lỗi 500.
    """
    mock_session = MagicMock()
    # db.get() trả None → nhánh INSERT
    mock_session.get.return_value = None

    captured_model = {}

    def capture_add(model):
        captured_model['instance'] = model

    mock_session.add.side_effect = capture_add
    mock_session.flush.return_value = None

    # Patch _to_entity để không cần flush thật
    with patch.object(SQLContestRepository, '_to_entity', return_value=contest_entity):
        repo = SQLContestRepository(db_session=mock_session)
        repo.save(contest_entity)

    model: ContestModel = captured_model['instance']

    # ❌ BUG cũ: model.status == "DRAFT" (raw string, type là str)
    # ✅ Fix đúng: model.status phải là ContestStatus.DRAFT (Enum instance)
    #
    # Lưu ý: ContestStatus(str, Enum) → isinstance(ContestStatus.DRAFT, str) luôn True
    # vì Enum kế thừa str. Cần dùng type() để phân biệt raw string vs Enum.
    assert isinstance(model.status, ContestStatus), (
        f"Expected ContestStatus Enum instance, got {model.status!r} (type: {type(model.status).__name__}). "
        "Lỗi này gây DataError khi SQLAlchemy flush với PgEnum."
    )
    assert type(model.status) is not str, (
        f"model.status là raw string '{model.status}' — phải là ContestStatus Enum instance, không phải str thuần."
    )


def test_update_contest_passes_enum_instance_not_string(contest_entity, now):
    """
    Khi UPDATE Contest đã có, ContestModel.status PHẢI nhận Enum instance.
    Tương tự lỗi INSERT — cùng nguyên nhân ở nhánh else của save().
    """
    mock_session = MagicMock()

    existing_model = MagicMock(spec=ContestModel)
    # db.get() trả model có sẵn → nhánh UPDATE
    mock_session.get.return_value = existing_model
    mock_session.flush.return_value = None

    with patch.object(SQLContestRepository, '_to_entity', return_value=contest_entity):
        repo = SQLContestRepository(db_session=mock_session)
        repo.save(contest_entity)

    # ❌ BUG cũ: existing_model.status = "DRAFT" (raw string)
    # ✅ Fix đúng: existing_model.status = ContestStatus.DRAFT (Enum)
    #
    # Lưu ý: ContestStatus(str, Enum) → isinstance(ContestStatus.DRAFT, str) luôn True.
    # Dùng type() để phân biệt chính xác raw string vs Enum instance.
    assert isinstance(existing_model.status, ContestStatus), (
        f"UPDATE: Expected ContestStatus Enum instance, got {existing_model.status!r} "
        f"(type: {type(existing_model.status).__name__}). Lỗi này gây DataError với PgEnum."
    )
    assert type(existing_model.status) is not str, (
        f"UPDATE: model.status là raw string — phải là ContestStatus Enum instance."
    )


def test_save_calls_flush_after_insert(contest_entity):
    """Đảm bảo save() gọi db.flush() sau khi add model mới."""
    mock_session = MagicMock()
    mock_session.get.return_value = None

    with patch.object(SQLContestRepository, '_to_entity', return_value=contest_entity):
        repo = SQLContestRepository(db_session=mock_session)
        repo.save(contest_entity)

    mock_session.flush.assert_called_once()


def test_save_calls_flush_after_update(contest_entity):
    """Đảm bảo save() gọi db.flush() sau khi update model có sẵn."""
    mock_session = MagicMock()
    existing_model = MagicMock(spec=ContestModel)
    mock_session.get.return_value = existing_model

    with patch.object(SQLContestRepository, '_to_entity', return_value=contest_entity):
        repo = SQLContestRepository(db_session=mock_session)
        repo.save(contest_entity)

    mock_session.flush.assert_called_once()
