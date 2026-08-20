"""
Database Session — SQLAlchemy async engine + session factory.
"""
import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from app.core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,      # Kiểm tra kết nối trước khi dùng
    pool_size=50,
    max_overflow=100,
    pool_recycle=1800,       # Đóng connection sau 30 phút để tránh lỗi stale connection
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


from app.application.interfaces.repositories import IUnitOfWork  # noqa: E402

class SQLUnitOfWork(IUnitOfWork):
    """
    Implementation của Unit of Work Pattern sử dụng SQLAlchemy Session.
    """
    def __init__(self, db: Session):
        self.db = db

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
