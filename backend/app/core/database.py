"""
Database Session — SQLAlchemy async engine + session factory.
"""
import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,      # Kiểm tra kết nối trước khi dùng
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG,     # Log SQL nếu DEBUG=true
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """
    Base class cho toàn bộ SQLAlchemy models.
    Tất cả model trong adapters/database/models/ phải kế thừa từ đây.
    """
    pass
