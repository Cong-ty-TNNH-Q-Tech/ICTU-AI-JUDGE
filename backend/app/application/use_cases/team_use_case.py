import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from app.application.interfaces.repositories import IChallengeRepository, ITeamRepository, IUserRepository, IUnitOfWork
from app.application.dtos.team_dtos import CreateInviteResponseDTO, TeamResponseDTO
from app.domain.entities.entities import InviteStatus, TeamEntity
from app.domain.exceptions.exceptions import (
    TeamAlreadyLockedError,
    TeamFullError,
    UserAlreadyInTeamError,
    PermissionDeniedError,
    NotFoundError,
    InvalidTokenError,
)

logger = logging.getLogger(__name__)

class TeamUseCase:
    def __init__(
        self,
        team_repo: ITeamRepository,
        challenge_repo: IChallengeRepository,
        user_repo: IUserRepository,
        uow: IUnitOfWork,
    ):
        self.team_repo = team_repo
        self.challenge_repo = challenge_repo
        self.user_repo = user_repo
        self.uow = uow

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)

    def create_invite(self, team_id: uuid.UUID, leader_id: uuid.UUID, base_url: str) -> CreateInviteResponseDTO:
        logger.info(f"Leader {leader_id} is creating an invite for team {team_id}")
        team = self.team_repo.get_by_id(team_id)
        if not team:
            raise NotFoundError("Không tìm thấy đội")

        if team.leader_id != leader_id:
            raise PermissionDeniedError("Chỉ trưởng nhóm mới được tạo mã mời")

        challenge = self.challenge_repo.get_by_id(team.challenge_id)
        if not challenge:
            raise NotFoundError("Không tìm thấy bài thi")

        now = self._now()
        if challenge.is_team_locked(now):
            raise TeamAlreadyLockedError("Đã qua thời hạn chốt đội, không thể mời thêm thành viên")

        if team.is_full(challenge.max_team_size):
            raise TeamFullError(f"Đội đã đủ số lượng thành viên tối đa ({challenge.max_team_size})")

        # Invalidate old invites for anti-spam
        self.team_repo.invalidate_invites(team.id)

        token = secrets.token_urlsafe(32)
        expires_at = now + timedelta(days=1)
        
        self.team_repo.create_invite(
            team_id=team.id,
            inviter_id=leader_id,
            token=token,
            expires_at=expires_at
        )
        self.uow.commit()
        
        logger.info(f"Invite token generated successfully for team {team_id}")

        invite_url = f"{base_url}/join?token={token}"
        return CreateInviteResponseDTO(
            token=token,
            invite_url=invite_url,
            expires_at=expires_at
        )

    def join_team(self, user_id: uuid.UUID, token: str) -> TeamResponseDTO:
        logger.info(f"User {user_id} is attempting to join a team using token")
        now = self._now()
        invite = self.team_repo.get_invite_by_token(token)
        if not invite or not invite.is_valid(now):
            raise InvalidTokenError("Mã mời không hợp lệ hoặc đã hết hạn")

        team = self.team_repo.get_by_id(invite.team_id)
        if not team:
            raise NotFoundError("Đội không tồn tại")

        challenge = self.challenge_repo.get_by_id(team.challenge_id)
        if not challenge:
            raise NotFoundError("Không tìm thấy bài thi")

        if challenge.is_team_locked(now):
            raise TeamAlreadyLockedError("Đã qua thời hạn chốt đội, không thể gia nhập")

        if team.is_full(challenge.max_team_size):
            raise TeamFullError("Đội đã đủ số lượng thành viên tối đa")

        # Kiểm tra user đã ở trong team khác của challenge này chưa
        existing_team = self.team_repo.get_by_challenge_and_user(team.challenge_id, user_id)
        if existing_team:
            if existing_team.id == team.id:
                raise UserAlreadyInTeamError("Bạn đã ở trong đội này rồi")
            
            # Check if existing team is a default Team of 1
            if len(existing_team.member_ids) > 1:
                raise UserAlreadyInTeamError("Bạn đã thuộc một đội khác trong bài thi này")
            
            if self.team_repo.has_submissions(existing_team.id):
                raise UserAlreadyInTeamError("Đội hiện tại của bạn đã nộp bài, không thể gia nhập đội khác")
            
            # Delete the default 1-person team
            logger.info(f"Deleting default 1-person team {existing_team.id} for user {user_id}")
            self.team_repo.delete(existing_team.id)

        # Add user vào team
        self.team_repo.add_member(team.id, user_id)
        self.team_repo.update_invite_status(token, InviteStatus.ACCEPTED)
        self.uow.commit()

        logger.info(f"User {user_id} joined team {team.id} successfully")

        # Lấy lại team để trả về DTO
        team = self.team_repo.get_by_id(invite.team_id)
        return TeamResponseDTO(
            id=team.id,
            name=team.name,
            challenge_id=team.challenge_id,
            leader_id=team.leader_id,
            created_at=team.created_at,
            member_ids=team.member_ids
        )

    def auto_create_team_if_not_exists(self, user_id: uuid.UUID, challenge_id: uuid.UUID) -> TeamResponseDTO:
        challenge = self.challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise NotFoundError("Không tìm thấy bài thi")

        existing_team = self.team_repo.get_by_challenge_and_user(challenge_id, user_id)
        if existing_team:
            return TeamResponseDTO(
                id=existing_team.id,
                name=existing_team.name,
                challenge_id=existing_team.challenge_id,
                leader_id=existing_team.leader_id,
                created_at=existing_team.created_at,
                member_ids=existing_team.member_ids
            )

        now = self._now()
        if challenge.is_team_locked(now):
            raise TeamAlreadyLockedError("Đã qua thời hạn ghi danh/chốt đội")

        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("Không tìm thấy user")

        team_id = uuid.uuid4()
        team_entity = TeamEntity(
            id=team_id,
            name=user.full_name,
            challenge_id=challenge_id,
            leader_id=user_id,
            created_at=now,
            member_ids=[user_id]
        )
        
        # Save team configures basic team data. We must also add the leader to members list in DB.
        self.team_repo.save(team_entity)
        self.team_repo.add_member(team_id, user_id)
        self.uow.commit()

        logger.info(f"Auto-created 1-person team {team_id} for user {user_id}")

        team = self.team_repo.get_by_id(team_id)
        return TeamResponseDTO(
            id=team.id,
            name=team.name,
            challenge_id=team.challenge_id,
            leader_id=team.leader_id,
            created_at=team.created_at,
        member_ids=team.member_ids
        )

    def kick_member(self, team_id: uuid.UUID, user_id: uuid.UUID, requester_id: uuid.UUID) -> None:
        team = self.team_repo.get_by_id(team_id)
        if not team:
            raise NotFoundError("Không tìm thấy đội")
            
        if team.leader_id != requester_id:
            raise PermissionDeniedError("Chỉ trưởng nhóm mới được phép xóa thành viên")
            
        if user_id not in team.member_ids:
            raise NotFoundError("Người dùng không nằm trong đội này")
            
        if user_id == team.leader_id:
            raise PermissionDeniedError("Không thể xóa trưởng nhóm khỏi đội")
            
        self.team_repo.remove_member(team_id, user_id)
        self.uow.commit()
        logger.info(f"User {requester_id} kicked user {user_id} from team {team_id}")

    def get_user_teams(self, user_id: uuid.UUID, page: int, size: int) -> dict:
        teams, total = self.team_repo.get_user_teams(user_id, page, size)
        items = [
            TeamResponseDTO(
                id=t.id,
                name=t.name,
                challenge_id=t.challenge_id,
                leader_id=t.leader_id,
                created_at=t.created_at,
                member_ids=t.member_ids
            )
            for t in teams
        ]
        
        total_pages = (total + size - 1) // size if size > 0 else 0
        return {
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "total_pages": total_pages
        }

    def update_team_name(self, team_id: uuid.UUID, requester_id: uuid.UUID, new_name: str) -> TeamResponseDTO:
        team = self.team_repo.get_by_id(team_id)
        if not team:
            raise NotFoundError("Không tìm thấy đội")

        if team.leader_id != requester_id:
            raise PermissionDeniedError("Chỉ trưởng nhóm mới được phép đổi tên đội")

        challenge = self.challenge_repo.get_by_id(team.challenge_id)
        if challenge and challenge.is_team_locked(self._now()):
            raise TeamAlreadyLockedError("Đã qua thời hạn chốt đội, không thể đổi tên")

        updated_team = self.team_repo.update_name(team_id, new_name)
        if not updated_team:
            raise NotFoundError("Đội không tồn tại hoặc đã bị xóa")

        self.uow.commit()
        logger.info(f"Team {team_id} renamed to {new_name} by user {requester_id}")

        return TeamResponseDTO(
            id=updated_team.id,
            name=updated_team.name,
            challenge_id=updated_team.challenge_id,
            leader_id=updated_team.leader_id,
            created_at=updated_team.created_at,
            member_ids=updated_team.member_ids
        )
