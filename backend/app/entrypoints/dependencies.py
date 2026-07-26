"""
FastAPI Dependency Injection — Inbound layer.
Inject DB session, Settings và current_user vào Use Cases qua Depends.
"""
import uuid
from collections.abc import Generator

import jwt
from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import SessionLocal
from app.application.interfaces.repositories import IUserRepository
from app.adapters.database.user_repository import UserRepository
from app.application.interfaces.clients import IGoogleAuthClient
from app.adapters.clients.google_auth_client import GoogleAuthClient
from app.domain.entities.entities import UserEntity
from app.domain.exceptions.exceptions import PermissionDeniedError

settings = get_settings()


def get_db() -> Generator[Session, None, None]:
    """
    Yield một DB session và tự động đóng sau khi request kết thúc.
    Dùng trong mọi Router: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_settings_dep() -> Settings:
    """Alias để inject Settings qua Depends trong Router."""
    return get_settings()


def get_current_user_id(
    access_token: str | None = Cookie(default=None, alias="access_token"),
) -> uuid.UUID:
    """
    Dependency: đọc JWT từ HttpOnly Cookie 'access_token'.
    Trả về user_id (UUID) đã được verify.
    Raises HTTP 401 nếu token thiếu hoặc không hợp lệ.
    """
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.",
        )
    try:
        payload = jwt.decode(
            access_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id_str: str | None = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token không hợp lệ: thiếu subject.",
            )
        return uuid.UUID(user_id_str)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token đã hết hạn. Vui lòng đăng nhập lại.",
        )
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ.",
        )


def get_user_repository(db: Session = Depends(get_db)) -> IUserRepository:
    """Dependency: inject UserRepository."""
    return UserRepository(db)


def get_google_auth_client() -> IGoogleAuthClient:
    """Dependency: inject GoogleAuthClient."""
    return GoogleAuthClient()


def get_current_user(
    user_id: uuid.UUID = Depends(get_current_user_id),
    user_repo: IUserRepository = Depends(get_user_repository),
) -> UserEntity:
    """
    Dependency: lấy UserEntity đầy đủ từ DB dựa trên token.
    Raises 401 nếu user không tồn tại hoặc đã bị xóa.
    """
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Người dùng không tồn tại hoặc đã bị khóa.",
        )
    return user


def require_admin(user: UserEntity = Depends(get_current_user)) -> UserEntity:
    """
    Dependency: kiểm tra quyền ADMIN.
    Raises 403 nếu không phải ADMIN.
    """
    if not user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền thực hiện thao tác này.",
        )
    return user


# Re-export kiểu để Router dùng làm type hint
DBSession = Session
