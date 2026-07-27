import logging
import uuid
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

    def upvote(self, solution_id: uuid.UUID, user_id: uuid.UUID) -> SolutionEntity | None:
        """
        Upvote solution — chống double-vote qua bảng solution_upvotes.
        Trả về entity sau khi cập nhật, hoặc None nếu solution không tồn tại.
        Raises ValueError nếu user đã upvote rồi.
        """
        model = self._session.query(SolutionModel).filter(SolutionModel.id == solution_id).first()
        if not model:
            return None

        # Kiểm tra đã vote chưa
        existing = (
            self._session.query(SolutionUpvoteModel)
            .filter(
                SolutionUpvoteModel.solution_id == solution_id,
                SolutionUpvoteModel.user_id == user_id,
            )
            .first()
        )
        if existing:
            raise ValueError("Bạn đã upvote bài này rồi.")

        # Ghi nhận vote
        vote_record = SolutionUpvoteModel(solution_id=solution_id, user_id=user_id)
        self._session.add(vote_record)

        # Tăng counter
        model.upvotes += 1
        self._session.flush()
        logger.info("Solution upvoted — id=%s user=%s upvotes=%d", solution_id, user_id, model.upvotes)
        return _to_entity(model)
