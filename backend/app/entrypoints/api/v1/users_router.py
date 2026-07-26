"""
Users Router — UC01 (me), UC07 (my teams).
[OWNER] Thành viên phụ trách: User Module
TODO: Implement các endpoint bên dưới
"""
import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.entrypoints.dependencies import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/me")
async def get_me(db: Session = Depends(get_db)):
    """Lấy thông tin user hiện tại từ JWT Cookie."""
    # TODO: Decode JWT từ cookie → get user từ DB
    raise NotImplementedError("Users router — chưa implement")


@router.get("/me/teams")
async def get_my_teams(page: int = 1, size: int = 20, db: Session = Depends(get_db)):
    """Lấy danh sách Đội thi của user hiện tại (phân trang)."""
    # TODO: Implement
    raise NotImplementedError("Users router — chưa implement")
