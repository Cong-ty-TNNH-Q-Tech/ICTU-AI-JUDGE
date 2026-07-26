"""
FastAPI Dependency Injection — Inbound layer.
Inject DB session và Settings vào Use Cases qua Depends.
"""
from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import SessionLocal


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


# Re-export kiểu để Router dùng làm type hint
DBSession = Session
