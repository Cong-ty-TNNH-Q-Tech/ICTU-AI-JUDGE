"""
Leaderboard Repository Adapter (SQLAlchemy).
"""
import uuid
from typing import Optional

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.adapters.database.models import LeaderboardModel, TeamModel, SubmissionModel
from app.application.interfaces.repositories import ILeaderboardRepository
from app.domain.entities.entities import LeaderboardEntryEntity, MetricDirection


class SQLLeaderboardRepository(ILeaderboardRepository):
    def __init__(self, db_session: Session):
        self.db = db_session

    def _to_entity(self, model: LeaderboardModel, rank: int, team_name: Optional[str] = None, entries: int = 0) -> LeaderboardEntryEntity:
        return LeaderboardEntryEntity(
            id=model.id,
            challenge_id=model.challenge_id,
            team_id=model.team_id,
            best_public_score=model.best_public_score,
            last_submission_time=model.last_submission_time,
            rank=rank,
            entries=entries,
            updated_at=model.updated_at,
            best_private_score=model.best_private_score,
            best_public_submission_id=model.best_public_submission_id,
            best_private_submission_id=model.best_private_submission_id,
            is_source_code_submitted=model.is_source_code_submitted,
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

    def upsert_with_lock(self, entry: LeaderboardEntryEntity, direction: MetricDirection = MetricDirection.HIGHER_IS_BETTER) -> LeaderboardEntryEntity:
        """
        Sử dụng PostgreSQL INSERT ... ON CONFLICT DO UPDATE để chống Race Condition 
        hiệu quả mà không gặp lỗi IntegrityError khi 2 requests cùng INSERT.
        Điểm số sẽ được update Atomic trực tiếp bằng mệnh đề WHERE.
        """
        from sqlalchemy.dialects.postgresql import insert

        stmt = insert(LeaderboardModel).values(
            id=entry.id,
            challenge_id=entry.challenge_id,
            team_id=entry.team_id,
            best_public_score=entry.best_public_score,
            best_private_score=entry.best_private_score,
            best_public_submission_id=entry.best_public_submission_id,
            best_private_submission_id=entry.best_private_submission_id,
            last_submission_time=entry.last_submission_time,
            rank=entry.rank,
            is_source_code_submitted=entry.is_source_code_submitted,
        )

        update_dict = {
            "best_public_score": stmt.excluded.best_public_score,
            "best_private_score": func.coalesce(stmt.excluded.best_private_score, LeaderboardModel.best_private_score),
            "best_public_submission_id": stmt.excluded.best_public_submission_id,
            "best_private_submission_id": func.coalesce(stmt.excluded.best_private_submission_id, LeaderboardModel.best_private_submission_id),
            "last_submission_time": stmt.excluded.last_submission_time,
            "updated_at": func.now()
        }

        if direction == MetricDirection.HIGHER_IS_BETTER:
            condition = LeaderboardModel.best_public_score < stmt.excluded.best_public_score
        else:
            condition = LeaderboardModel.best_public_score > stmt.excluded.best_public_score

        do_update_stmt = stmt.on_conflict_do_update(
            constraint="uq_leaderboard_challenge_team",
            set_=update_dict,
            where=condition
        ).returning(LeaderboardModel)

        model = self.db.execute(do_update_stmt).scalar_one_or_none()
        self.db.flush()
        
        if not model:
            # If the WHERE condition fails, DO UPDATE is skipped, and returning() yields nothing.
            # We fetch and return the existing record.
            existing = self.get_by_team_and_challenge(entry.team_id, entry.challenge_id)
            if not existing:
                raise RuntimeError("Race condition: Leaderboard entry should exist but wasn't found.")
            return existing

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

        entries_sq = (
            select(func.count(SubmissionModel.id))
            .where(
                SubmissionModel.team_id == LeaderboardModel.team_id,
                SubmissionModel.challenge_id == LeaderboardModel.challenge_id
            )
            .correlate(LeaderboardModel)
            .scalar_subquery()
            .label("entries_count")
        )

        stmt = (
            select(LeaderboardModel, TeamModel.name, rank_func, entries_sq)
            .join(TeamModel, LeaderboardModel.team_id == TeamModel.id)
            .where(LeaderboardModel.challenge_id == challenge_id)
            .order_by(score_order, LeaderboardModel.last_submission_time.asc())
            .offset((page - 1) * size)
            .limit(size)
        )

        results = self.db.execute(stmt).all()
        
        items = []
        for model, team_name, computed_rank, entries_count in results:
            items.append((self._to_entity(model, rank=computed_rank, team_name=team_name, entries=entries_count), team_name))

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

        entries_sq = (
            select(func.count(SubmissionModel.id))
            .where(
                SubmissionModel.team_id == LeaderboardModel.team_id,
                SubmissionModel.challenge_id == LeaderboardModel.challenge_id
            )
            .correlate(LeaderboardModel)
            .scalar_subquery()
            .label("entries_count")
        )

        stmt = (
            select(LeaderboardModel, TeamModel.name, rank_func, entries_sq)
            .join(TeamModel, LeaderboardModel.team_id == TeamModel.id)
            .where(LeaderboardModel.challenge_id == challenge_id)
            .order_by(score_order, LeaderboardModel.last_submission_time.asc())
            .offset((page - 1) * size)
            .limit(size)
        )

        results = self.db.execute(stmt).all()
        
        items = []
        for model, team_name, computed_rank, entries_count in results:
            items.append((self._to_entity(model, rank=computed_rank, team_name=team_name, entries=entries_count), team_name))

        return items, total

    def update_source_code_submitted(
        self, team_id: uuid.UUID, challenge_id: uuid.UUID, submitted: bool = True
    ) -> None:
        stmt = (
            update(LeaderboardModel)
            .where(
                LeaderboardModel.team_id == team_id,
                LeaderboardModel.challenge_id == challenge_id,
            )
            .values(is_source_code_submitted=submitted)
        )
        self.db.execute(stmt)

    def export_all(
        self,
        challenge_id: uuid.UUID,
        direction: MetricDirection = MetricDirection.HIGHER_IS_BETTER,
        leaderboard_type: str = "private",
    ) -> list[dict]:
        from app.adapters.database.models import TeamMemberModel, UserModel

        if leaderboard_type == "public":
            effective_score = LeaderboardModel.best_public_score
        else:
            effective_score = func.coalesce(LeaderboardModel.best_private_score, LeaderboardModel.best_public_score)

        if direction == MetricDirection.HIGHER_IS_BETTER:
            score_order = effective_score.desc()
        else:
            score_order = effective_score.asc()

        rank_func = func.rank().over(
            order_by=[score_order, LeaderboardModel.last_submission_time.asc()]
        ).label("computed_rank")

        # Step 1: CTE to compute rank per team
        cte = (
            select(
                LeaderboardModel.team_id,
                LeaderboardModel.best_public_score,
                LeaderboardModel.best_private_score,
                LeaderboardModel.last_submission_time,
                rank_func,
            )
            .where(LeaderboardModel.challenge_id == challenge_id)
            .cte("ranked_leaderboard")
        )

        # Step 2: Join CTE with Teams and Users
        stmt = (
            select(
                cte.c.computed_rank,
                TeamModel.name.label("team_name"),
                UserModel.student_id,
                UserModel.full_name,
                cte.c.best_public_score,
                cte.c.best_private_score,
                cte.c.last_submission_time,
            )
            .join(TeamModel, cte.c.team_id == TeamModel.id)
            .join(TeamMemberModel, TeamModel.id == TeamMemberModel.team_id)
            .join(UserModel, TeamMemberModel.user_id == UserModel.id)
            .where(
                TeamModel.deleted_at.is_(None),
                UserModel.deleted_at.is_(None),
            )
            .order_by(cte.c.computed_rank.asc(), UserModel.student_id.asc())
        )

        results = self.db.execute(stmt).all()

        return [
            {
                "Rank": row.computed_rank,
                "Team Name": row.team_name,
                "MSSV": row.student_id,
                "Full Name": row.full_name,
                "Public Score": row.best_public_score,
                "Private Score": row.best_private_score,
                "Last Submission Time": row.last_submission_time.strftime("%Y-%m-%d %H:%M:%S") if row.last_submission_time else "",
            }
            for row in results
        ]
