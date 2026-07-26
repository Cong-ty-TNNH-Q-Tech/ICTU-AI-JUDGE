"""
Admin Router — UC12 (Quản lý sinh viên), UC13 (Thảo luận).
[OWNER] Thành viên phụ trách: Admin Module
TODO: Implement các endpoint bên dưới
"""
import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.entrypoints.dependencies import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/users")
async def list_users(
    q: str = "",
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
):
    """UC12 — Danh sách sinh viên (Admin only). Tìm kiếm theo email/họ tên."""
    # TODO: Validate Admin role từ JWT, implement query
    raise NotImplementedError("Admin router — chưa implement")


@router.patch("/users/{user_id}")
async def update_user_status(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """UC12 — Khóa/Mở khóa tài khoản sinh viên (Admin only)."""
    # TODO: Implement
    raise NotImplementedError("Admin router — chưa implement")
