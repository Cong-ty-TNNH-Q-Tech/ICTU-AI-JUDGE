"""
Leaderboard Repository Adapter (SQLAlchemy).
"""
import uuid
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.adapters.database.models import LeaderboardModel, TeamModel
from app.application.interfaces.repositories import ILeaderboardRepository
from app.domain.entities.entities import LeaderboardEntryEntity, MetricDirection


class SQLLeaderboardRepository(ILeaderboardRepository):
    def __init__(self, db_session: Session):
        self.db = db_session

    def _to_entity(self, model: LeaderboardModel, rank: int, team_name: Optional[str] = None) -> LeaderboardEntryEntity:
        return LeaderboardEntryEntity(
            id=model.id,
            challenge_id=model.challenge_id,
            team_id=model.team_id,
            best_public_score=model.best_public_score,
            last_submission_time=model.last_submission_time,
            rank=rank,
            updated_at=model.updated_at,
            best_private_score=model.best_private_score,
            best_public_submission_id=model.best_public_submission_id,
            best_private_submission_id=model.best_private_submission_id,
        )

    def get_by_team_and_challenge(
        self, team_id: uuid.UUID, challenge_id: uuid.UUID
    ) -> LeaderboardEntryEntity | None:
        model = (
            self.db.execute(
                select(LeaderboardModel).where(
                    LeaderboardModel.team_id == team_id,
                    LeaderboardModel.challenge_id == challenge_id,
                )
            )
            .scalars()
            .first()
        )
        if not model:
            return None
        return self._to_entity(model, rank=model.rank)

    def upsert_with_lock(self, entry: LeaderboardEntryEntity) -> LeaderboardEntryEntity:
        """
        Dùng select ... for update để chống race condition.
        Vì SQLAlchemy k có native upsert cho mọi dialect chuẩn bằng ORM thông thường,
        ta select with_for_update, nếu có thì update, chưa có thì add mới.
        """
        model = (
            self.db.execute(
                select(LeaderboardModel)
                .where(
                    LeaderboardModel.team_id == entry.team_id,
                    LeaderboardModel.challenge_id == entry.challenge_id,
                )
                .with_for_update()
            )
            .scalars()
            .first()
        )

        if model:
            model.best_public_score = entry.best_public_score
            model.best_private_score = entry.best_private_score
            model.best_public_submission_id = entry.best_public_submission_id
            model.best_private_submission_id = entry.best_private_submission_id
            model.last_submission_time = entry.last_submission_time
            model.rank = entry.rank
        else:
            model = LeaderboardModel(
                id=entry.id,
                challenge_id=entry.challenge_id,
                team_id=entry.team_id,
                best_public_score=entry.best_public_score,
                best_private_score=entry.best_private_score,
                best_public_submission_id=entry.best_public_submission_id,
                best_private_submission_id=entry.best_private_submission_id,
                last_submission_time=entry.last_submission_time,
                rank=entry.rank,
            )
            self.db.add(model)

        self.db.flush()
        return self._to_entity(model, rank=model.rank)

    def list_public(
        self, challenge_id: uuid.UUID, page: int, size: int, direction: MetricDirection = MetricDirection.HIGHER_IS_BETTER
    ) -> tuple[list[tuple[LeaderboardEntryEntity, str]], int]:
        # Return tuple(list(tuple(entity, team_name)), total) since we need team_name
        
        # Tie-breaking logic: sort by score (desc/asc), then by time (asc)
        if direction == MetricDirection.HIGHER_IS_BETTER:
            score_order = LeaderboardModel.best_public_score.desc()
        else:
            score_order = LeaderboardModel.best_public_score.asc()

        rank_func = func.rank().over(
            order_by=[score_order, LeaderboardModel.last_submission_time.asc()]
        ).label("computed_rank")

        total = self.db.execute(
            select(func.count()).where(LeaderboardModel.challenge_id == challenge_id)
        ).scalar_one()

        stmt = (
            select(LeaderboardModel, TeamModel.name, rank_func)
            .join(TeamModel, LeaderboardModel.team_id == TeamModel.id)
            .where(LeaderboardModel.challenge_id == challenge_id)
            .order_by(score_order, LeaderboardModel.last_submission_time.asc())
            .offset((page - 1) * size)
            .limit(size)
        )

        results = self.db.execute(stmt).all()
        
        items = []
        for model, team_name, computed_rank in results:
            items.append((self._to_entity(model, rank=computed_rank, team_name=team_name), team_name))

        return items, total

    def list_private(
        self, challenge_id: uuid.UUID, page: int, size: int, direction: MetricDirection = MetricDirection.HIGHER_IS_BETTER
    ) -> tuple[list[tuple[LeaderboardEntryEntity, str]], int]:
        
        # Fallback to public score if private score is NULL
        effective_score = func.coalesce(LeaderboardModel.best_private_score, LeaderboardModel.best_public_score)
        
        if direction == MetricDirection.HIGHER_IS_BETTER:
            score_order = effective_score.desc()
        else:
            score_order = effective_score.asc()

        rank_func = func.rank().over(
            order_by=[score_order, LeaderboardModel.last_submission_time.asc()]
        ).label("computed_rank")

        total = self.db.execute(
            select(func.count()).where(LeaderboardModel.challenge_id == challenge_id)
        ).scalar_one()

        stmt = (
            select(LeaderboardModel, TeamModel.name, rank_func)
            .join(TeamModel, LeaderboardModel.team_id == TeamModel.id)
            .where(LeaderboardModel.challenge_id == challenge_id)
            .order_by(score_order, LeaderboardModel.last_submission_time.asc())
            .offset((page - 1) * size)
            .limit(size)
        )

        results = self.db.execute(stmt).all()
        
        items = []
        for model, team_name, computed_rank in results:
            items.append((self._to_entity(model, rank=computed_rank, team_name=team_name), team_name))

        return items, total

    def recalculate_ranks(self, challenge_id: uuid.UUID, direction: MetricDirection = MetricDirection.HIGHER_IS_BETTER) -> None:
        if direction == MetricDirection.HIGHER_IS_BETTER:
            score_order = LeaderboardModel.best_public_score.desc()
        else:
            score_order = LeaderboardModel.best_public_score.asc()

        rank_func = func.rank().over(
            order_by=[score_order, LeaderboardModel.last_submission_time.asc()]
        ).label("computed_rank")

        stmt = (
            select(LeaderboardModel, rank_func)
            .where(LeaderboardModel.challenge_id == challenge_id)
        )
        
        results = self.db.execute(stmt).all()
        for model, computed_rank in results:
            model.rank = computed_rank
            
        self.db.flush()
