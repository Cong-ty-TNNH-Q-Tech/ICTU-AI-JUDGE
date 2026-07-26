"""
Auth Router — UC01: Đăng nhập Google OAuth & Đăng xuất.
[OWNER] Thành viên phụ trách: Auth Module
TODO: Implement các endpoint bên dưới
"""
import logging
from typing import Any

from fastapi import APIRouter, Depends, Response
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
async def google_login(
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


