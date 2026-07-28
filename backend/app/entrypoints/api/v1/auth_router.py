"""
Auth Router — Xử lý Đăng nhập & Authentication.
[OWNER] Thành viên phụ trách: Core/Auth Module
"""
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel

from app.entrypoints.dependencies import get_user_repository, get_auth_use_case
from app.application.interfaces.repositories import IUserRepository
from app.application.use_cases.auth_use_case import AuthUseCase
from app.core.config import get_settings
from app.core.security import create_access_token

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


class GoogleLoginRequest(BaseModel):
    google_token: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str

@router.post("/google-login", response_model=UserResponse)
def google_login(
    request: GoogleLoginRequest,
    response: Response,
    auth_use_case: AuthUseCase = Depends(get_auth_use_case),
):
    """
    UC01 — Đăng nhập bằng Google OAuth.
    """
    user = auth_use_case.login_with_google(request.google_token)
    
    # Tạo JWT access token
    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    
    # Set vào HttpOnly Cookie
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=access_token,
        httponly=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
    )


@router.post("/logout")
async def logout(response: Response):
    """
    UC01 — Đăng xuất: Xóa JWT HttpOnly Cookie.
    """
    response.delete_cookie(key=settings.COOKIE_NAME, httponly=True, samesite="lax")
    return {"message": "Đăng xuất thành công"}

@router.get("/debug-admin")
def debug_admin(auth_use_case: AuthUseCase = Depends(get_auth_use_case)):
    import os
    user = auth_use_case._user_repo.get_by_email("trungff07@gmail.com")
    return {
        "settings_email": settings.ROOT_ADMIN_EMAIL,
        "auth_use_case_email": auth_use_case._root_admin_email,
        "os_environ": os.environ.get("ROOT_ADMIN_EMAIL"),
        "is_root": auth_use_case._is_root_admin("trungff07@gmail.com"),
        "db_role": getattr(user, "role", None)
    }
