"""
Team Repository Adapter (SQLAlchemy).
Implements ITeamRepository.
"""
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.adapters.database.models import SubmissionModel, TeamMemberModel, TeamModel
from app.application.interfaces.repositories import ITeamRepository
from app.domain.entities.entities import TeamEntity, TeamInviteEntity, InviteStatus


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
                select(TeamModel)
                .options(joinedload(TeamModel.members))
                .where(
                    TeamModel.id == team_id,
                    TeamModel.deleted_at == None,  # noqa: E711
                )
            )
            .unique()
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
                .options(joinedload(TeamModel.members))
                .join(TeamMemberModel, TeamModel.id == TeamMemberModel.team_id)
                .where(
                    TeamModel.challenge_id == challenge_id,
                    TeamMemberModel.user_id == user_id,
                    TeamModel.deleted_at == None,  # noqa: E711
                )
            )
            .unique()
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

    def update_name(self, team_id: uuid.UUID, new_name: str) -> TeamEntity | None:
        model = (
            self.db.execute(
                select(TeamModel)
                .where(TeamModel.id == team_id, TeamModel.deleted_at.is_(None))
                .with_for_update()
            )
            .scalar_one_or_none()
        )
        if not model:
            return None
            
        model.name = new_name
        self.db.flush()
        self.db.refresh(model)
        
        # Load members for entity representation if missing
        # To populate members correctly after refresh, we either load it via joinedload in initial query,
        # or we just let _to_entity use whatever lazy-loaded state it has. 
        # But wait, if _to_entity accesses `model.members`, it will trigger a lazy load which is fine in a session.
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

    def create_invite(self, team_id: uuid.UUID, inviter_id: uuid.UUID, token: str, expires_at: datetime) -> str:
        from app.adapters.database.models import TeamInviteModel
        
        model = TeamInviteModel(
            team_id=team_id,
            inviter_id=inviter_id,
            invitee_email="", # Chưa sử dụng tính năng invite bằng email trực tiếp nên để rỗng
            token=token,
            expires_at=expires_at
        )
        self.db.add(model)
        self.db.flush()
        return token

    def get_invite_by_token(self, token: str) -> "TeamInviteEntity | None":
        from app.adapters.database.models import TeamInviteModel
        from app.domain.entities.entities import TeamInviteEntity
        
        model = (
            self.db.execute(
                select(TeamInviteModel).where(TeamInviteModel.token == token)
            )
            .scalars()
            .first()
        )
        if not model:
            return None
            
        return TeamInviteEntity(
            id=model.id,
            team_id=model.team_id,
            inviter_id=model.inviter_id,
            invitee_email=model.invitee_email,
            token=model.token,
            status=model.status,
            expires_at=model.expires_at,
            created_at=model.created_at
        )

    def update_invite_status(self, token: str, status: "InviteStatus") -> None:
        from app.adapters.database.models import TeamInviteModel
        
        model = (
            self.db.execute(
                select(TeamInviteModel).where(TeamInviteModel.token == token)
            )
            .scalars()
            .first()
        )
        if model:
            model.status = status
            self.db.flush()

    def add_member(self, team_id: uuid.UUID, user_id: uuid.UUID) -> None:
        from app.adapters.database.models import TeamMemberModel
        
        model = TeamMemberModel(
            team_id=team_id,
            user_id=user_id
        )
        self.db.add(model)
        self.db.flush()

    def remove_member(self, team_id: uuid.UUID, user_id: uuid.UUID) -> None:
        from app.adapters.database.models import TeamMemberModel
        
        model = (
            self.db.execute(
                select(TeamMemberModel).where(
                    TeamMemberModel.team_id == team_id,
                    TeamMemberModel.user_id == user_id
                )
            )
            .scalars()
            .first()
        )
        if model:
            self.db.delete(model)
            self.db.flush()

    def delete(self, team_id: uuid.UUID) -> None:
        from datetime import timezone
        
        model = (
            self.db.execute(select(TeamModel).where(TeamModel.id == team_id))
            .scalars()
            .first()
        )
        if model:
            model.deleted_at = datetime.now(timezone.utc)
            self.db.flush()

    def invalidate_invites(self, team_id: uuid.UUID) -> None:
        from app.adapters.database.models import TeamInviteModel
        
        invites = (
            self.db.execute(
                select(TeamInviteModel).where(
                    TeamInviteModel.team_id == team_id,
                    TeamInviteModel.status == InviteStatus.PENDING
                )
            )
            .scalars()
            .all()
        )
        for invite in invites:
            invite.status = InviteStatus.EXPIRED
        self.db.flush()

    def get_user_teams(self, user_id: uuid.UUID, page: int, size: int) -> tuple[list[TeamEntity], int]:
        from sqlalchemy import func
        
        # Base query joining team_members
        stmt = (
            select(TeamModel)
            .join(TeamModel.members)
            .options(joinedload(TeamModel.members))
            .where(
                TeamMemberModel.user_id == user_id,
                TeamModel.deleted_at.is_(None)
            )
        )
        
        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0
        
        # Paginate
        paginated_stmt = stmt.order_by(TeamModel.created_at.desc()).offset((page - 1) * size).limit(size)
        models = self.db.execute(paginated_stmt).unique().scalars().all()
        
        return [self._to_entity(m) for m in models], total
