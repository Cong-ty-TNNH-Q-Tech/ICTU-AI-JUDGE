"""
Team Repository Adapter (SQLAlchemy).
Implements ITeamRepository.
"""
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters.database.models import SubmissionModel, TeamMemberModel, TeamModel
from app.application.interfaces.repositories import ITeamRepository
from app.domain.entities.entities import TeamEntity


class SQLTeamRepository(ITeamRepository):
    def __init__(self, db_session: Session):
        self.db = db_session

    @staticmethod
    def _to_entity(model: TeamModel) -> TeamEntity:
        member_ids = [m.user_id for m in model.members]
        return TeamEntity(
            id=model.id,
            name=model.name,
            challenge_id=model.challenge_id,
            leader_id=model.leader_id,
            created_at=model.created_at,
            deleted_at=model.deleted_at,
            member_ids=member_ids,
        )

    def get_by_id(self, team_id: uuid.UUID) -> TeamEntity | None:
        model = (
            self.db.execute(
                select(TeamModel).where(
                    TeamModel.id == team_id,
                    TeamModel.deleted_at == None,  # noqa: E711
                )
            )
            .scalars()
            .first()
        )
        if not model:
            return None
        return self._to_entity(model)

    def get_by_challenge_and_user(
        self, challenge_id: uuid.UUID, user_id: uuid.UUID
    ) -> TeamEntity | None:
        """
        Lấy Team của User trong một Challenge.
        Dùng để xác định team_id khi user nộp bài.
        """
        model = (
            self.db.execute(
                select(TeamModel)
                .join(TeamMemberModel, TeamModel.id == TeamMemberModel.team_id)
                .where(
                    TeamModel.challenge_id == challenge_id,
                    TeamMemberModel.user_id == user_id,
                    TeamModel.deleted_at == None,  # noqa: E711
                )
            )
            .scalars()
            .first()
        )
        if not model:
            return None
        return self._to_entity(model)

    def save(self, team: TeamEntity) -> TeamEntity:
        model = TeamModel(
            id=team.id,
            name=team.name,
            challenge_id=team.challenge_id,
            leader_id=team.leader_id,
        )
        self.db.add(model)
        self.db.flush()
        self.db.refresh(model)
        return self._to_entity(model)

    def has_submissions(self, team_id: uuid.UUID) -> bool:
        result = (
            self.db.execute(
                select(SubmissionModel.id)
                .where(SubmissionModel.team_id == team_id)
                .limit(1)
            )
            .scalars()
            .first()
        )
        return result is not None
