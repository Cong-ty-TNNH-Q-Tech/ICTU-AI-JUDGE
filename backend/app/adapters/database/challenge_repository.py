"""
Challenge Repository Adapter (SQLAlchemy).
Implements IChallengeRepository.
"""
import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.adapters.database.models import ChallengeModel, SubmissionModel
from app.application.interfaces.repositories import IChallengeRepository
from app.domain.entities.entities import (
    ChallengeEntity,
    ChallengeStatus,
    ChallengeType,
    MetricDirection,
)


class SQLChallengeRepository(IChallengeRepository):
    def __init__(self, db_session: Session):
        self.db = db_session

    @staticmethod
    def _to_entity(model: ChallengeModel) -> ChallengeEntity:
        return ChallengeEntity(
            id=model.id,
            title=model.title,
            description=model.description,
            type=ChallengeType(model.type),
            status=ChallengeStatus(model.status),
            start_time=model.start_time,
            end_time=model.end_time,
            rate_limit_minutes=model.rate_limit_minutes,
            max_file_size_mb=model.max_file_size_mb,
            metric_name=model.metric_name,
            metric_direction=MetricDirection(model.metric_direction),
            created_by=model.created_by,
            created_at=model.created_at,
            dataset_url=model.dataset_url or "",
            ground_truth_url=model.ground_truth_url or "",
            custom_metric_url=model.custom_metric_url or "",
            team_lock_deadline=model.team_lock_deadline,
            deleted_at=model.deleted_at,
        )

    def get_by_id(self, challenge_id: uuid.UUID) -> ChallengeEntity | None:
        model = (
            self.db.execute(
                select(ChallengeModel).where(
                    ChallengeModel.id == challenge_id,
                    ChallengeModel.deleted_at == None,  # noqa: E711
                )
            )
            .scalars()
            .first()
        )
        if not model:
            return None
        return self._to_entity(model)

    def save(self, challenge: ChallengeEntity) -> ChallengeEntity:
        model = ChallengeModel(
            id=challenge.id,
            title=challenge.title,
            description=challenge.description,
            type=challenge.type,
            status=challenge.status,
            start_time=challenge.start_time,
            end_time=challenge.end_time,
            rate_limit_minutes=challenge.rate_limit_minutes,
            max_file_size_mb=challenge.max_file_size_mb,
            metric_name=challenge.metric_name,
            metric_direction=challenge.metric_direction,
            created_by=challenge.created_by,
            dataset_url=challenge.dataset_url,
            ground_truth_url=challenge.ground_truth_url,
            custom_metric_url=challenge.custom_metric_url,
            team_lock_deadline=challenge.team_lock_deadline,
        )
        self.db.add(model)
        self.db.flush()
        self.db.refresh(model)
        return self._to_entity(model)

    def update(self, challenge: ChallengeEntity) -> ChallengeEntity:
        model = (
            self.db.execute(
                select(ChallengeModel).where(ChallengeModel.id == challenge.id)
            )
            .scalars()
            .first()
        )
        if not model:
            raise ValueError(f"Challenge {challenge.id} not found")

        model.title = challenge.title
        model.description = challenge.description
        model.status = challenge.status
        model.start_time = challenge.start_time
        model.end_time = challenge.end_time
        model.rate_limit_minutes = challenge.rate_limit_minutes
        model.max_file_size_mb = challenge.max_file_size_mb
        model.metric_name = challenge.metric_name
        model.metric_direction = challenge.metric_direction
        model.dataset_url = challenge.dataset_url
        model.ground_truth_url = challenge.ground_truth_url
        model.custom_metric_url = challenge.custom_metric_url
        model.team_lock_deadline = challenge.team_lock_deadline
        self.db.flush()
        return self._to_entity(model)

    def soft_delete(self, challenge_id: uuid.UUID) -> None:
        from sqlalchemy import update
        self.db.execute(
            update(ChallengeModel)
            .where(ChallengeModel.id == challenge_id)
            .values(deleted_at=datetime.utcnow())
        )
        self.db.flush()

    def list_all(
        self, page: int, size: int, status_filter: str | None = None
    ) -> tuple[list[ChallengeEntity], int]:
        query = select(ChallengeModel).where(ChallengeModel.deleted_at == None)  # noqa: E711
        if status_filter:
            query = query.where(ChallengeModel.status == status_filter)

        total = self.db.execute(
            select(func.count()).select_from(query.subquery())
        ).scalar_one()

        models = (
            self.db.execute(
                query.order_by(ChallengeModel.created_at.desc())
                .offset((page - 1) * size)
                .limit(size)
            )
            .scalars()
            .all()
        )
        return [self._to_entity(m) for m in models], total

    def has_successful_submission(self, challenge_id: uuid.UUID) -> bool:
        from app.domain.entities.entities import SubmissionStatus
        result = (
            self.db.execute(
                select(SubmissionModel.id)
                .where(
                    SubmissionModel.challenge_id == challenge_id,
                    SubmissionModel.status == SubmissionStatus.SUCCESS,
                )
                .limit(1)
            )
            .scalars()
            .first()
        )
        return result is not None

    def list_participants(self, challenge_id: uuid.UUID, page: int, size: int) -> tuple[list[dict], int]:
        """UC10 - Lấy danh sách participants của 1 challenge (Kèm thông tin User)."""
        from app.adapters.database.models import ChallengeParticipantModel, UserModel
        
        total = self.db.execute(
            select(func.count(ChallengeParticipantModel.id))
            .where(ChallengeParticipantModel.challenge_id == challenge_id)
        ).scalar_one()

        results = self.db.execute(
            select(ChallengeParticipantModel, UserModel)
            .join(UserModel, ChallengeParticipantModel.user_id == UserModel.id)
            .where(ChallengeParticipantModel.challenge_id == challenge_id)
            .order_by(ChallengeParticipantModel.joined_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        ).all()

        participants = []
        for part, user in results:
            participants.append({
                "participant_id": part.id,
                "user_id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "student_id": user.student_id,
                "is_approved": part.is_approved,
                "joined_at": part.joined_at
            })
            
        return participants, total

    def add_participants(self, challenge_id: uuid.UUID, user_ids: list[uuid.UUID]) -> int:
        """UC10 - Thêm danh sách user vào whitelist. Trả về số lượng thêm thành công."""
        from app.adapters.database.models import ChallengeParticipantModel
        
        # Bỏ qua những user đã có trong whitelist
        existing = self.db.execute(
            select(ChallengeParticipantModel.user_id)
            .where(
                ChallengeParticipantModel.challenge_id == challenge_id,
                ChallengeParticipantModel.user_id.in_(user_ids)
            )
        ).scalars().all()
        
        existing_set = set(existing)
        new_users = [uid for uid in user_ids if uid not in existing_set]
        
        if not new_users:
            return 0
            
        for uid in new_users:
            self.db.add(ChallengeParticipantModel(
                challenge_id=challenge_id,
                user_id=uid,
                is_approved=True # Admin add luôn được approved
            ))
            
        self.db.flush()
        return len(new_users)

