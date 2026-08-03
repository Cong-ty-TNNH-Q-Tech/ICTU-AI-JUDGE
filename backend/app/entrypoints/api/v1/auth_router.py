"""
Auth Router — Xử lý Đăng nhập & Authentication.
[OWNER] Thành viên phụ trách: Core/Auth Module
"""
import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Response
from pydantic import BaseModel

from app.application.dtos.auth_dtos import (
    ForgotPasswordRequestDTO,
    LoginRequestDTO,
    ResetPasswordRequestDTO,
)
from app.application.use_cases.auth_use_case import AuthUseCase
from app.core.config import get_settings
from app.core.security import create_access_token
from app.entrypoints.dependencies import get_auth_use_case

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


@router.post("/login", response_model=UserResponse)
def login_with_password(
    request: LoginRequestDTO,
    response: Response,
    auth_use_case: AuthUseCase = Depends(get_auth_use_case),
):
    """
    Đăng nhập bằng email và mật khẩu.
    Logic xác thực được xử lý tại AuthUseCase — tuân thủ Hexagonal Architecture.
    """
    user = auth_use_case.login_with_password(request.email, request.password)

    access_token = create_access_token(subject=str(user.id), role=user.role.value)

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


def send_reset_email_task(email: str, full_name: str, reset_link: str):
    from app.adapters.clients.mail_client import SMTPMailClient
    html_content = f"""
    <html>
        <body>
            <h2>Đặt lại mật khẩu</h2>
            <p>Xin chào {full_name},</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu tại ICTU AI JUDGE. Vui lòng click vào đường dẫn bên dưới (có hiệu lực 15 phút):</p>
            <a href="{reset_link}">{reset_link}</a>
            <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
        </body>
    </html>
    """
    try:
        mail_client = SMTPMailClient()
        mail_client.send_email(
            to_email=email,
            subject="[ICTU AI JUDGE] Đặt lại mật khẩu",
            html_content=html_content
        )
        logger.info("Password reset email sent to %s", email)
    except Exception as e:
        logger.error("Failed to send password reset email to %s: %s", email, e)


@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequestDTO,
    background_tasks: BackgroundTasks,
    auth_use_case: AuthUseCase = Depends(get_auth_use_case),
):
    """
    Yêu cầu đặt lại mật khẩu. Gửi email chứa link reset qua BackgroundTasks.
    Luôn trả về 200 dù email có tồn tại hay không (chống email enumeration).
    """
    result = auth_use_case.request_password_reset(request.email)
    if result:
        email, full_name, reset_link = result
        background_tasks.add_task(send_reset_email_task, email, full_name, reset_link)

    return {"message": "Nếu email hợp lệ, hướng dẫn đặt lại mật khẩu sẽ được gửi đến email của bạn."}


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequestDTO,
    auth_use_case: AuthUseCase = Depends(get_auth_use_case),
):
    """
    Đặt lại mật khẩu mới thông qua token.
    """
    auth_use_case.reset_password(request.token, request.new_password)
    return {"message": "Mật khẩu đã được đặt lại thành công."}
