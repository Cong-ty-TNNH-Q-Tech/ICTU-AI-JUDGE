import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from app.adapters.database.challenge_repository import SQLChallengeRepository
from app.adapters.database.team_repository import SQLTeamRepository
from app.adapters.database.user_repository import SQLUserRepository
from app.application.dtos.team_dtos import CreateInviteResponseDTO, TeamResponseDTO
from app.domain.entities.entities import InviteStatus, TeamEntity
from app.domain.exceptions.exceptions import (
    TeamAlreadyLockedError,
    TeamFullError,
    UserAlreadyInTeamError,
    PermissionDeniedError,
)

class TeamUseCase:
    def __init__(
        self,
        team_repo: SQLTeamRepository,
        challenge_repo: SQLChallengeRepository,
        user_repo: SQLUserRepository,
    ):
        self.team_repo = team_repo
        self.challenge_repo = challenge_repo
        self.user_repo = user_repo

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)

    def create_invite(self, team_id: uuid.UUID, leader_id: uuid.UUID, base_url: str) -> CreateInviteResponseDTO:
        team = self.team_repo.get_by_id(team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Không tìm thấy đội")

        if team.leader_id != leader_id:
            raise PermissionDeniedError("Chỉ trưởng nhóm mới được tạo mã mời")

        challenge = self.challenge_repo.get_by_id(team.challenge_id)
        if not challenge:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài thi")

        now = self._now()
        if challenge.is_team_locked(now):
            raise TeamAlreadyLockedError("Đã qua thời hạn chốt đội, không thể mời thêm thành viên")

        if team.is_full(challenge.max_team_size):
            raise TeamFullError(f"Đội đã đủ số lượng thành viên tối đa ({challenge.max_team_size})")

        token = secrets.token_urlsafe(32)
        expires_at = now + timedelta(days=1)
        
        self.team_repo.create_invite(
            team_id=team.id,
            inviter_id=leader_id,
            token=token,
            expires_at=expires_at
        )

        invite_url = f"{base_url}/join?token={token}"
        return CreateInviteResponseDTO(
            token=token,
            invite_url=invite_url,
            expires_at=expires_at
        )

    def join_team(self, user_id: uuid.UUID, token: str) -> TeamResponseDTO:
        now = self._now()
        invite = self.team_repo.get_invite_by_token(token)
        if not invite or not invite.is_valid(now):
            raise HTTPException(status_code=400, detail="Mã mời không hợp lệ hoặc đã hết hạn")

        team = self.team_repo.get_by_id(invite.team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Đội không tồn tại")

        challenge = self.challenge_repo.get_by_id(team.challenge_id)
        if not challenge:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài thi")

        if challenge.is_team_locked(now):
            raise TeamAlreadyLockedError("Đã qua thời hạn chốt đội, không thể gia nhập")

        if team.is_full(challenge.max_team_size):
            raise TeamFullError("Đội đã đủ số lượng thành viên tối đa")

        # Kiểm tra user đã ở trong team khác của challenge này chưa
        existing_team = self.team_repo.get_by_challenge_and_user(team.challenge_id, user_id)
        if existing_team:
            raise UserAlreadyInTeamError("Bạn đã thuộc một đội khác trong bài thi này")

        # Add user vào team
        self.team_repo.add_member(team.id, user_id)
        self.team_repo.update_invite_status(token, InviteStatus.ACCEPTED)

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
            raise HTTPException(status_code=404, detail="Không tìm thấy bài thi")

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
            raise HTTPException(status_code=404, detail="Không tìm thấy user")

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

        team = self.team_repo.get_by_id(team_id)
        return TeamResponseDTO(
            id=team.id,
            name=team.name,
            challenge_id=team.challenge_id,
            leader_id=team.leader_id,
            created_at=team.created_at,
            member_ids=team.member_ids
        )
