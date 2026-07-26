"""
Teams Router — UC02: Quản lý Đội thi.
[OWNER] Thành viên phụ trách: Team Module
TODO: Implement các endpoint bên dưới
"""
import logging
import uuid
from fastapi import APIRouter, Depends, Request

from sqlalchemy.orm import Session

from app.adapters.database.challenge_repository import SQLChallengeRepository
from app.adapters.database.team_repository import SQLTeamRepository
from app.adapters.database.user_repository import SQLUserRepository
from app.application.dtos.team_dtos import CreateInviteResponseDTO, JoinTeamRequestDTO, TeamResponseDTO
from app.application.use_cases.team_use_case import TeamUseCase
from app.entrypoints.dependencies import get_current_user_id, get_db

logger = logging.getLogger(__name__)
router = APIRouter()

def _get_team_use_case(db: Session) -> TeamUseCase:
    return TeamUseCase(
        team_repo=SQLTeamRepository(db),
        challenge_repo=SQLChallengeRepository(db),
        user_repo=SQLUserRepository(db)
    )

@router.post("/{team_id}/invites", response_model=CreateInviteResponseDTO)
async def create_invite(
    team_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id)
):
    """
    UC02 — Trưởng nhóm tạo mã mời (Invite Token).
    Kiểm tra: Đã qua team_lock_deadline? Đội đã full chưa?
    """
    use_case = _get_team_use_case(db)
    base_url = str(request.base_url).rstrip("/") + "/api/v1/teams"
    result = use_case.create_invite(team_id, user_id, base_url)
    db.commit()
    return result


@router.post("/join", response_model=TeamResponseDTO)
async def join_team(
    body: JoinTeamRequestDTO,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id)
):
    """
    UC02 — Gia nhập đội qua Token mời.
    Kiểm tra: Token hợp lệ? Đã thuộc đội khác chưa?
    """
    use_case = _get_team_use_case(db)
    result = use_case.join_team(user_id, body.token)
    db.commit()
    return result
