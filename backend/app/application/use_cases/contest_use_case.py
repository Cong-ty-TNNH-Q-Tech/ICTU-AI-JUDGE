"""
Contest Use Case — UC: Contest Entity (Issue #123).
"""
import logging
import uuid
from datetime import datetime, timezone

from app.application.dtos.challenge_dtos import ChallengeResponseDTO
from app.application.utils.mappers import challenge_to_dto
from app.application.dtos.contest_dtos import (
    ContestChallengesResponseDTO,
    ContestCreateDTO,
    ContestListResponseDTO,
    ContestResponseDTO,
    ContestUpdateDTO,
)
from app.application.interfaces.repositories import IContestRepository, IChallengeRepository, IUnitOfWork
from app.domain.entities.entities import ChallengeEntity, ContestEntity, ContestStatus, ChallengeStatus
from app.domain.exceptions.exceptions import NotFoundError

logger = logging.getLogger(__name__)


class ContestUseCase:
    def __init__(self, contest_repo: IContestRepository, challenge_repo: IChallengeRepository, uow: IUnitOfWork):
        self._contest_repo = contest_repo
        self._challenge_repo = challenge_repo
        self._uow = uow

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _to_dto(self, entity: ContestEntity) -> ContestResponseDTO:
        return ContestResponseDTO(
            id=entity.id,
            title=entity.title,
            description=entity.description,
            status=entity.status,
            start_time=entity.start_time,
            end_time=entity.end_time,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            created_by=entity.created_by,
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

    def get_challenges(self, contest_id: uuid.UUID) -> ContestChallengesResponseDTO:
        """Lấy danh sách challenges con của một contest."""
        entity = self._contest_repo.get_by_id(contest_id)
        if not entity:
            raise NotFoundError(f"Contest {contest_id} không tồn tại.")
        challenges = self._contest_repo.get_challenges(contest_id)
        items = [challenge_to_dto(c) for c in challenges]
        return ContestChallengesResponseDTO(
            contest_id=contest_id,
            items=items,
            total=len(items),
        )

    def create(self, dto: ContestCreateDTO, admin_id: uuid.UUID) -> ContestResponseDTO:
        # Business rule: end_time phải sau start_time
        if dto.end_time is not None and dto.end_time <= dto.start_time:
            raise ValueError("end_time phải sau start_time.")
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

        # Dùng exclude_unset=True để phân biệt "không gửi field" vs "gửi tường minh = None"
        # Ví dụ: PATCH {end_time: null} → xóa deadline; PATCH {} → không đổi gì
        update_data = dto.model_dump(exclude_unset=True)

        if "title" in update_data:
            entity.title = update_data["title"]
        if "description" in update_data:
            entity.description = update_data["description"]
        if "status" in update_data and update_data["status"] is not None:
            new_status = ContestStatus(update_data["status"])
            if new_status == ContestStatus.PUBLISHED and entity.status != ContestStatus.PUBLISHED:
                challenges = self._contest_repo.get_challenges(contest_id)
                published_challenges = [c for c in challenges if getattr(c, "status", None) == ChallengeStatus.PUBLISHED]
                if not published_challenges:
                    raise ValueError("Không thể publish Contest khi chưa có bài thi (Challenge) nào được PUBLISHED.")
            entity.status = new_status
        if "start_time" in update_data:
            entity.start_time = update_data["start_time"]
        if "end_time" in update_data:
            entity.end_time = update_data["end_time"]  # Cho phép set về None (xóa deadline)

        # Business rule: sau khi patch, end_time phải sau start_time (nếu có)
        if entity.end_time is not None and entity.end_time <= entity.start_time:
            raise ValueError("end_time phải sau start_time.")

        entity.updated_at = datetime.now(timezone.utc)
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
        
        # Cascade soft-delete cho các challenge con
        challenges = self._contest_repo.get_challenges(contest_id)
        for c in challenges:
            self._challenge_repo.soft_delete(c.id)
            
        self._uow.commit()
        logger.info("Contest soft-deleted with %d child challenges: id=%s", len(challenges), contest_id)
