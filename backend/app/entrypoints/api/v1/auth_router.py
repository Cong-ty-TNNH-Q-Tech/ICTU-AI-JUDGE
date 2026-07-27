"""
Auth Router — UC01: Đăng nhập Google OAuth & Đăng xuất.
[OWNER] Thành viên phụ trách: Auth Module
TODO: Implement các endpoint bên dưới
"""
import logging
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel

from app.entrypoints.dependencies import get_user_repository, get_google_auth_client
from app.application.interfaces.repositories import IUserRepository
from app.application.interfaces.clients import IGoogleAuthClient
from app.application.use_cases.auth_use_case import AuthUseCase
from app.domain.entities.entities import UserEntity
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
    user_repo: IUserRepository = Depends(get_user_repository),
    google_client: IGoogleAuthClient = Depends(get_google_auth_client),
):
    """
    UC01 — Đăng nhập bằng Google OAuth.
    """
    auth_use_case = AuthUseCase(user_repo, google_client)
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


# ==========================================
# DEV-ONLY: Đăng nhập không cần Google OAuth
# ==========================================
class DevLoginRequest(BaseModel):
    user_id: str


@router.post("/dev-login", response_model=UserResponse, include_in_schema=False)
def dev_login(
    request: DevLoginRequest,
    response: Response,
    user_repo: IUserRepository = Depends(get_user_repository),
):
    """[DEV ONLY] Đăng nhập bằng user_id, bỏ qua Google OAuth. Bị block khi DEBUG=False."""
    if not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Endpoint này chỉ dành cho môi trường development.",
        )
    try:
        uid = uuid.UUID(request.user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="user_id không hợp lệ.")

    user = user_repo.get_by_id(uid)
    if not user:
        raise HTTPException(status_code=404, detail="User không tồn tại.")

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=access_token,
        httponly=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    logger.warning("[DEV LOGIN] %s (%s) đăng nhập dev endpoint", user.email, user.id)
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
    )
