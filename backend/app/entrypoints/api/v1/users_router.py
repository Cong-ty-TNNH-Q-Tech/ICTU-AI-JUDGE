"""
Users Router — UC01 (me), UC07 (my teams).
[OWNER] Thành viên phụ trách: User Module
TODO: Implement các endpoint bên dưới
"""
import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.entrypoints.dependencies import get_db, get_current_user
from app.domain.entities.entities import UserEntity

logger = logging.getLogger(__name__)
router = APIRouter()

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str


@router.get("/me", response_model=UserResponse)
async def get_me(user: UserEntity = Depends(get_current_user)):
    """Lấy thông tin user hiện tại từ JWT Cookie."""
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
    )


@router.get("/me/teams")
async def get_my_teams(page: int = 1, size: int = 20, db: Session = Depends(get_db)):
    """Lấy danh sách Đội thi của user hiện tại (phân trang)."""
    # TODO: Implement
    raise NotImplementedError("Users router — chưa implement")
