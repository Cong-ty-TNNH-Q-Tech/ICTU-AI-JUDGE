"""
User Repository Adapter (SQLAlchemy).
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.adapters.database.models import UserModel


class SQLUserRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(
        self, q: str, page: int, size: int
    ) -> tuple[list[UserModel], int]:
        """
        Lấy danh sách người dùng, tìm kiếm theo tên hoặc email.
        Trả về tuple (danh_sách, tổng_số).
        """
        query = select(UserModel)
        
        if q:
            search = f"%{q}%"
            query = query.where(
                or_(
                    UserModel.full_name.ilike(search),
                    UserModel.email.ilike(search),
                    UserModel.student_id.ilike(search),
                )
            )

        # Tính tổng số record thỏa mãn
        total = len(self.db.execute(query).scalars().all())

        # Phân trang
        query = query.order_by(UserModel.created_at.desc()).offset((page - 1) * size).limit(size)
        
        users = self.db.execute(query).scalars().all()
        return list(users), total

    def get_by_id(self, user_id: uuid.UUID) -> UserModel | None:
        """Lấy chi tiết 1 user."""
        return self.db.execute(
            select(UserModel).where(UserModel.id == user_id)
        ).scalars().first()

    def update_status(self, user_id: uuid.UUID, is_active: bool) -> bool:
        """
        Cập nhật trạng thái user (Soft delete).
        is_active = False -> set deleted_at = now()
        is_active = True -> set deleted_at = None
        Trả về True nếu cập nhật thành công, False nếu không tìm thấy.
        """
        user = self.get_by_id(user_id)
        if not user:
            return False
            
        if is_active:
            user.deleted_at = None
        else:
            if not user.deleted_at:
                user.deleted_at = datetime.now(tz=timezone.utc)
                
        self.db.add(user)
        # Commit sẽ được thực hiện tại Use Case hoặc Router
        return True
