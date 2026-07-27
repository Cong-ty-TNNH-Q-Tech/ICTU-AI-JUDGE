import logging
import uuid

from sqlalchemy import update as sql_update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.adapters.database.models import SolutionModel, SolutionUpvoteModel
from app.application.interfaces.repositories import ISolutionRepository
from app.domain.entities.entities import SolutionEntity

logger = logging.getLogger(__name__)


def _to_entity(model: SolutionModel) -> SolutionEntity:
    return SolutionEntity(
        id=model.id,
        challenge_id=model.challenge_id,
        user_id=model.user_id,
        title=model.title,
        content=model.content,
        notebook_url=model.notebook_url,
        upvotes=model.upvotes,
        created_at=model.created_at,
    )


def _to_model(entity: SolutionEntity) -> SolutionModel:
    return SolutionModel(
        id=entity.id,
        challenge_id=entity.challenge_id,
        user_id=entity.user_id,
        title=entity.title,
        content=entity.content,
        notebook_url=entity.notebook_url,
        upvotes=entity.upvotes,
        created_at=entity.created_at,
    )


class PostgresSolutionRepository(ISolutionRepository):
    def __init__(self, session: Session):
        self._session = session

    def save(self, solution: SolutionEntity) -> SolutionEntity:
        model = _to_model(solution)
        self._session.add(model)
        self._session.flush()
        return _to_entity(model)

    def list_by_challenge(self, challenge_id: uuid.UUID) -> list[SolutionEntity]:
        models = (
            self._session.query(SolutionModel)
            .filter(SolutionModel.challenge_id == challenge_id)
            .order_by(SolutionModel.created_at.desc())
            .all()
        )
        return [_to_entity(m) for m in models]

    def list_by_user(self, user_id: uuid.UUID) -> list[dict]:
        """
        Lấy danh sách solutions của user, kèm challenge_title (JOIN).
        Trả về list[dict] thay vì list[SolutionEntity] vì cần dữ liệu từ nhiều bảng.
        """
        from app.adapters.database.models import ChallengeModel
        rows = (
            self._session.query(SolutionModel, ChallengeModel.title)
            .join(ChallengeModel, SolutionModel.challenge_id == ChallengeModel.id)
            .filter(SolutionModel.user_id == user_id)
            .filter(ChallengeModel.deleted_at.is_(None))
            .order_by(SolutionModel.created_at.desc())
            .all()
        )
        return [
            {
                "id": sol.id,
                "challenge_id": sol.challenge_id,
                "challenge_title": title,
                "title": sol.title,
                "upvotes": sol.upvotes,
                "created_at": sol.created_at,
            }
            for sol, title in rows
        ]

    def upvote(self, solution_id: uuid.UUID, user_id: uuid.UUID) -> SolutionEntity | None:
        """
        Upvote solution — chống double-vote và race condition.

        Chiến lược an toàn đồng thời:
        1. Dùng begin_nested() (SAVEPOINT) để INSERT upvote record.
           Nếu UNIQUE constraint bị vi phạm → IntegrityError → chỉ rollback SAVEPOINT,
           không ảnh hưởng toàn bộ session.
        2. Dùng atomic SQL expression `SolutionModel.upvotes + 1` (thay vì Python +=)
           để tránh "Lost Update" khi nhiều thread/worker upvote cùng lúc.
        """
        model = (
            self._session.query(SolutionModel)
            .filter(SolutionModel.id == solution_id)
            .first()
        )
        if not model:
            return None

        # 1. INSERT upvote record — UNIQUE(solution_id, user_id) trên DB ngăn double-vote
        try:
            with self._session.begin_nested():  # SAVEPOINT — chỉ rollback block này nếu lỗi
                vote_record = SolutionUpvoteModel(solution_id=solution_id, user_id=user_id)
                self._session.add(vote_record)
        except IntegrityError:
            # UNIQUE constraint bị vi phạm → user đã upvote rồi
            raise ValueError("Bạn đã upvote bài này rồi.")

        # 2. Atomic increment — tránh "Lost Update" race condition
        # `SolutionModel.upvotes + 1` là SQL expression, KHÔNG phải Python arithmetic
        self._session.execute(
            sql_update(SolutionModel)
            .where(SolutionModel.id == solution_id)
            .values(upvotes=SolutionModel.upvotes + 1)
        )
        self._session.flush()

        # Refresh để lấy giá trị upvotes mới nhất từ DB
        self._session.refresh(model)
        logger.info(
            "Solution upvoted — id=%s user=%s upvotes=%d",
            solution_id,
            user_id,
            model.upvotes,
        )
        return _to_entity(model)
