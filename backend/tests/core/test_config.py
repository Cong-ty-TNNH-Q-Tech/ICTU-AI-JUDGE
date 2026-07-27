import os
from unittest import mock
import pytest
from app.core.config import Settings, get_settings

@pytest.fixture
def mock_env():
    with mock.patch.dict(os.environ, {
        "DATABASE_URL": "postgresql://test:test@localhost:5432/test",
        "S3_ACCESS_KEY": "test",
        "S3_SECRET_KEY": "test",
        "SECRET_KEY": "test_secret",
    }):
        yield

def test_get_settings(mock_env):
    get_settings.cache_clear()
    settings = get_settings()
    assert settings.DATABASE_URL == "postgresql://test:test@localhost:5432/test"
    assert settings.S3_ACCESS_KEY == "test"
    assert settings.S3_SECRET_KEY == "test"
    assert settings.SECRET_KEY == "test_secret"
    assert settings.APP_ENV == "development"
    assert settings.DEBUG is True
