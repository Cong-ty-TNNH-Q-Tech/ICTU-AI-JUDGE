"""
Teams Router — UC02: Quản lý Đội thi.
[OWNER] Thành viên phụ trách: Team Module
"""
import logging
import uuid
from fastapi import APIRouter, Depends, Request

from app.application.dtos.team_dtos import CreateInviteResponseDTO, JoinTeamRequestDTO, TeamResponseDTO, TeamUpdateRequestDTO
from app.application.use_cases.team_use_case import TeamUseCase
from app.entrypoints.dependencies import get_current_user_id, get_team_use_case
from app.core.config import Settings, get_settings
from app.domain.exceptions.exceptions import PermissionDeniedError, TeamAlreadyLockedError, NotFoundError
from fastapi import HTTPException

logger = logging.getLogger(__name__)
router = APIRouter()

@router.patch("/{team_id}", response_model=TeamResponseDTO)
async def update_team_name(
    team_id: uuid.UUID,
    body: TeamUpdateRequestDTO,
    use_case: TeamUseCase = Depends(get_team_use_case),
    user_id: uuid.UUID = Depends(get_current_user_id)
):
    """
    UC02 — Cập nhật thông tin đội (chỉ dành cho trưởng nhóm).
    """
    try:
        return use_case.update_team_name(team_id, user_id, body.name)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except (NotFoundError, TeamAlreadyLockedError) as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{team_id}/invites", response_model=CreateInviteResponseDTO)
async def create_invite(
    team_id: uuid.UUID,
    request: Request,
    use_case: TeamUseCase = Depends(get_team_use_case),
    user_id: uuid.UUID = Depends(get_current_user_id),
    settings: Settings = Depends(get_settings)
):
    """
    UC02 — Trưởng nhóm tạo mã mời (Invite Token).
    Kiểm tra: Đã qua team_lock_deadline? Đội đã full chưa?
    """
    base_url = settings.FRONTEND_URL.rstrip("/") + "/teams"
    return use_case.create_invite(team_id, user_id, base_url)


@router.post("/join", response_model=TeamResponseDTO)
async def join_team(
    body: JoinTeamRequestDTO,
    use_case: TeamUseCase = Depends(get_team_use_case),
    user_id: uuid.UUID = Depends(get_current_user_id)
):
    """
    UC02 — Gia nhập đội qua Token mời.
    Kiểm tra: Token hợp lệ? Đã thuộc đội khác chưa?
    """
    return use_case.join_team(user_id, body.token)


@router.delete("/{team_id}/members/{user_id}", status_code=204)
async def remove_member(
    team_id: uuid.UUID,
    user_id: uuid.UUID,
    use_case: TeamUseCase = Depends(get_team_use_case),
    requester_id: uuid.UUID = Depends(get_current_user_id)
):
    """
    Xóa thành viên khỏi đội (Chỉ dành cho trưởng nhóm).
    """
    use_case.kick_member(team_id, user_id, requester_id)
