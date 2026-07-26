"""
Teams Router — UC02: Quản lý Đội thi.
[OWNER] Thành viên phụ trách: Team Module
TODO: Implement các endpoint bên dưới
"""
import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.entrypoints.dependencies import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/{team_id}/invites")
async def create_invite(team_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    UC02 — Trưởng nhóm tạo mã mời (Invite Token).
    Kiểm tra: Đã qua team_lock_deadline? Đội đã full chưa?
    """
    # TODO: Implement
    raise NotImplementedError("Teams router — chưa implement")


@router.post("/join")
async def join_team(db: Session = Depends(get_db)):
    """
    UC02 — Gia nhập đội qua Token mời.
    Kiểm tra: Token hợp lệ? Đã thuộc đội khác chưa?
    """
    # TODO: Implement
    raise NotImplementedError("Teams router — chưa implement")
