"""
Security utilities — JWT generation, verification, password hashing.
Lưu JWT trong HttpOnly Cookie để chống XSS (không dùng Bearer Header).
"""
import logging
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from app.core.config import get_settings
from app.domain.exceptions.exceptions import AuthenticationError

logger = logging.getLogger(__name__)
settings = get_settings()

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==========================================
# PASSWORD HASHING
# ==========================================

def hash_password(plain_password: str) -> str:
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return _pwd_context.verify(plain_password, hashed_password)


# ==========================================
# JWT TOKEN
# ==========================================

def create_access_token(subject: str, role: str) -> str:
    """
    Tạo JWT access token.
    subject: user_id (UUID string)
    role: "STUDENT" | "ADMIN"
    """
    expire = datetime.now(tz=timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": subject,
        "role": role,
        "exp": expire,
        "iat": datetime.now(tz=timezone.utc),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    logger.debug("Access token created for subject=%s", subject)
    return token


def decode_access_token(token: str) -> dict:
    """
    Giải mã và validate JWT.
    Raise AuthenticationError nếu token hết hạn hoặc không hợp lệ.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT expired")
        raise AuthenticationError("Token đã hết hạn, vui lòng đăng nhập lại.")
    except jwt.InvalidTokenError as e:
        logger.warning("Invalid JWT: %s", e)
        raise AuthenticationError("Token không hợp lệ.")
