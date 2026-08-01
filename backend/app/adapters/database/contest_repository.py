"""
Contest Repository Adapter (SQLAlchemy).
Implements IContestRepository.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.adapters.database.models import ContestModel, ChallengeModel
from app.application.interfaces.repositories import IContestRepository
from app.domain.entities.entities import (
    ChallengeEntity,
    ChallengeStatus,
    ChallengeType,
    ContestEntity,
    ContestStatus,
    MetricDirection,
)


class SQLContestRepository(IContestRepository):
    def __init__(self, db_session: Session):
        self.db = db_session

    @staticmethod
    def _to_entity(model: ContestModel) -> ContestEntity:
        return ContestEntity(
            id=model.id,
            title=model.title,
            description=model.description,
            status=ContestStatus(model.status),
            start_time=model.start_time,
            end_time=model.end_time,
            created_by=model.created_by,
            created_at=model.created_at,
            deleted_at=model.deleted_at,
        )

    @staticmethod
    def _challenge_to_entity(model: ChallengeModel) -> ChallengeEntity:
        return ChallengeEntity(
            id=model.id,
            contest_id=model.contest_id,
            title=model.title,
            description=model.description,
            type=ChallengeType(model.type),
            status=ChallengeStatus(model.status),
            start_time=model.start_time,
            end_time=model.end_time,
            rate_limit_minutes=model.rate_limit_minutes,
            max_team_size=model.max_team_size,
            max_file_size_mb=model.max_file_size_mb,
            metric_name=model.metric_name,
            metric_direction=MetricDirection(model.metric_direction),
            dataset_url=model.dataset_url or "",
            ground_truth_url=model.ground_truth_url or "",
            custom_metric_url=model.custom_metric_url or "",
            team_lock_deadline=model.team_lock_deadline,
            created_by=model.created_by,
            created_at=model.created_at,
            deleted_at=model.deleted_at,
        )

    def get_by_id(self, contest_id: uuid.UUID) -> ContestEntity | None:
        stmt = (
            select(ContestModel)
            .where(ContestModel.id == contest_id)
            .where(ContestModel.deleted_at.is_(None))
        )
        model = self.db.scalars(stmt).first()
        return self._to_entity(model) if model else None

    def get_list(self, page: int, size: int, status: str | None = None) -> tuple[list[ContestEntity], int]:
        stmt = select(ContestModel).where(ContestModel.deleted_at.is_(None))
        if status:
            stmt = stmt.where(ContestModel.status == status)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.scalars(count_stmt).one()

        stmt = stmt.order_by(ContestModel.created_at.desc()).offset((page - 1) * size).limit(size)
        models = self.db.scalars(stmt).all()

        return [self._to_entity(m) for m in models], total

    def save(self, contest: ContestEntity) -> ContestEntity:
        model = self.db.get(ContestModel, contest.id)
        if not model:
            model = ContestModel(
                id=contest.id,
                title=contest.title,
                description=contest.description,
                status=contest.status.value,
                start_time=contest.start_time,
                end_time=contest.end_time,
                created_by=contest.created_by,
                created_at=contest.created_at,
                deleted_at=contest.deleted_at,
            )
            self.db.add(model)
        else:
            model.title = contest.title
            model.description = contest.description
            model.status = contest.status.value
            model.start_time = contest.start_time
            model.end_time = contest.end_time
            model.deleted_at = contest.deleted_at

        self.db.flush()
        return self._to_entity(model)

    def delete(self, contest_id: uuid.UUID) -> None:
        """Soft delete — đặt deleted_at thay vì xoá hàng."""
        model = self.db.get(ContestModel, contest_id)
        if model and model.deleted_at is None:
            model.deleted_at = datetime.now(timezone.utc)
            self.db.flush()

    def get_challenges(self, contest_id: uuid.UUID) -> list[ChallengeEntity]:
        """Lấy tất cả challenges thuộc contest, chưa bị soft delete, sắp theo start_time."""
        stmt = (
            select(ChallengeModel)
            .where(ChallengeModel.contest_id == contest_id)
            .where(ChallengeModel.deleted_at.is_(None))
            .order_by(ChallengeModel.start_time.asc())
        )
        models = self.db.scalars(stmt).all()
        return [self._challenge_to_entity(m) for m in models]
