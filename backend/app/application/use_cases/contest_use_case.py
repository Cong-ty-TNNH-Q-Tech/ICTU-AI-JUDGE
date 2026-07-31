"""
Contest Use Case — UC: Contest Entity (Issue #123).
"""
import logging
import uuid
from datetime import datetime, timezone

from app.application.dtos.challenge_dtos import ChallengeResponseDTO
from app.application.dtos.contest_dtos import (
    ContestCreateDTO,
    ContestListResponseDTO,
    ContestResponseDTO,
    ContestUpdateDTO,
)
from app.application.interfaces.repositories import IContestRepository, IUnitOfWork
from app.domain.entities.entities import ChallengeEntity, ContestEntity, ContestStatus
from app.domain.exceptions.exceptions import NotFoundError

logger = logging.getLogger(__name__)


class ContestUseCase:
    def __init__(self, contest_repo: IContestRepository, uow: IUnitOfWork):
        self._contest_repo = contest_repo
        self._uow = uow

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _to_dto(self, entity: ContestEntity) -> ContestResponseDTO:
        return ContestResponseDTO(
            id=entity.id,
            title=entity.title,
            description=entity.description,
            status=entity.status.value,
            start_time=entity.start_time,
            end_time=entity.end_time,
            created_at=entity.created_at,
            created_by=entity.created_by,
        )

    @staticmethod
    def _challenge_to_dto(entity: ChallengeEntity) -> ChallengeResponseDTO:
        return ChallengeResponseDTO(
            id=entity.id,
            title=entity.title,
            description=entity.description,
            type=entity.type,
            status=entity.status,
            start_time=entity.start_time,
            end_time=entity.end_time,
            rate_limit_minutes=entity.rate_limit_minutes,
            max_file_size_mb=entity.max_file_size_mb,
            metric_name=entity.metric_name,
            metric_direction=entity.metric_direction,
            created_by=entity.created_by,
            created_at=entity.created_at,
            dataset_url=entity.dataset_url,
            ground_truth_url=entity.ground_truth_url or None,
            custom_metric_url=entity.custom_metric_url or None,
            team_lock_deadline=entity.team_lock_deadline,
            max_team_size=entity.max_team_size,
            tags=[],
        )

    # ------------------------------------------------------------------
    # Public Use Case methods
    # ------------------------------------------------------------------

    def get_list(self, page: int, size: int, status: str | None = None) -> ContestListResponseDTO:
        items, total = self._contest_repo.get_list(page, size, status)
        total_pages = (total + size - 1) // size if size > 0 else 0
        return ContestListResponseDTO(
            items=[self._to_dto(item) for item in items],
            total=total,
            page=page,
            size=size,
            total_pages=total_pages,
        )

    def get_detail(self, contest_id: uuid.UUID) -> ContestResponseDTO:
        entity = self._contest_repo.get_by_id(contest_id)
        if not entity:
            raise NotFoundError(f"Contest {contest_id} không tồn tại.")
        return self._to_dto(entity)

    def get_challenges(self, contest_id: uuid.UUID) -> dict:
        """Lấy danh sách challenges con của một contest."""
        entity = self._contest_repo.get_by_id(contest_id)
        if not entity:
            raise NotFoundError(f"Contest {contest_id} không tồn tại.")
        challenges = self._contest_repo.get_challenges(contest_id)
        items = [self._challenge_to_dto(c) for c in challenges]
        return {"contest_id": contest_id, "items": items, "total": len(items)}

    def create(self, dto: ContestCreateDTO, admin_id: uuid.UUID) -> ContestResponseDTO:
        now = datetime.now(timezone.utc)
        entity = ContestEntity(
            id=uuid.uuid4(),
            title=dto.title,
            description=dto.description,
            status=ContestStatus(dto.status),
            start_time=dto.start_time,
            end_time=dto.end_time,
            created_by=admin_id,
            created_at=now,
        )
        saved_entity = self._contest_repo.save(entity)
        self._uow.commit()
        logger.info("Contest created: id=%s title=%s by admin=%s", saved_entity.id, saved_entity.title, admin_id)
        return self._to_dto(saved_entity)

    def update(self, contest_id: uuid.UUID, dto: ContestUpdateDTO) -> ContestResponseDTO:
        entity = self._contest_repo.get_by_id(contest_id)
        if not entity:
            raise NotFoundError(f"Contest {contest_id} không tồn tại.")

        if dto.title is not None:
            entity.title = dto.title
        if dto.description is not None:
            entity.description = dto.description
        if dto.status is not None:
            entity.status = ContestStatus(dto.status)
        if dto.start_time is not None:
            entity.start_time = dto.start_time
        if dto.end_time is not None:
            entity.end_time = dto.end_time

        saved_entity = self._contest_repo.save(entity)
        self._uow.commit()
        logger.info("Contest updated: id=%s", contest_id)
        return self._to_dto(saved_entity)

    def delete(self, contest_id: uuid.UUID) -> None:
        """Soft delete — kiểm tra tồn tại trước, sau đó đặt deleted_at."""
        entity = self._contest_repo.get_by_id(contest_id)
        if not entity:
            raise NotFoundError(f"Contest {contest_id} không tồn tại.")
        self._contest_repo.delete(contest_id)
        self._uow.commit()
        logger.info("Contest soft-deleted: id=%s", contest_id)
