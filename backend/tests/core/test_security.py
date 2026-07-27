import os
from unittest import mock
import pytest
from datetime import datetime, timezone, timedelta
import jwt
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.domain.exceptions.exceptions import AuthenticationError
from app.core.config import get_settings

def test_password_hashing():
    plain = "my_secure_password"
    hashed = hash_password(plain)
    assert plain != hashed
    assert verify_password(plain, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_create_and_decode_access_token():
    subject = "123e4567-e89b-12d3-a456-426614174000"
    role = "STUDENT"
    token = create_access_token(subject, role)
    
    assert isinstance(token, str)
    
    payload = decode_access_token(token)
    assert payload["sub"] == subject
    assert payload["role"] == role
    assert "exp" in payload
    assert "iat" in payload

def test_decode_expired_token():
    settings = get_settings()
    expire = datetime.now(tz=timezone.utc) - timedelta(minutes=1)
    payload = {
        "sub": "user_id",
        "role": "STUDENT",
        "exp": expire,
    }
    expired_token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    with pytest.raises(AuthenticationError, match="Token đã hết hạn"):
        decode_access_token(expired_token)

def test_decode_invalid_token():
    with pytest.raises(AuthenticationError, match="Token không hợp lệ"):
        decode_access_token("invalid.token.string")
