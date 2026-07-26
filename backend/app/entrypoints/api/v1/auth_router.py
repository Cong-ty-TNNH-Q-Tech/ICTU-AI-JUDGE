"""
Auth Router — UC01: Đăng nhập Google OAuth & Đăng xuất.
[OWNER] Thành viên phụ trách: Auth Module
TODO: Implement các endpoint bên dưới
"""
import logging

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.entrypoints.dependencies import get_db
from app.core.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


@router.post("/google-login")
async def google_login(response: Response, db: Session = Depends(get_db)):
    """
    UC01 — Đăng nhập bằng Google OAuth.
    1. Nhận google_token từ body
    2. Verify token với Google API
    3. Kiểm tra email đuôi @ictu.edu.vn
    4. Tạo/cập nhật User trong DB
    5. Set JWT vào HttpOnly Cookie
    """
    # TODO: Implement
    raise NotImplementedError("Auth router — chưa implement")


@router.post("/logout")
async def logout(response: Response):
    """
    UC01 — Đăng xuất: Xóa JWT HttpOnly Cookie.
    """
    # TODO: Implement
    response.delete_cookie(key=settings.COOKIE_NAME, httponly=True)
    return {"message": "Đăng xuất thành công"}
