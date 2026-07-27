"""
User Repository implementation based on SQLAlchemy.
"""
import uuid
from typing import Optional
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy import select, update

from app.application.interfaces.repositories import IUserRepository
from app.adapters.database.models import UserModel
from app.domain.entities.entities import UserEntity, UserRole

class UserRepository(IUserRepository):
    def __init__(self, session: Session):
        self._session = session

    def _to_entity(self, model: UserModel) -> UserEntity:
        return UserEntity(
            id=model.id,
            email=model.email,
            student_id=model.student_id,
            full_name=model.full_name,
            role=UserRole(model.role.value if hasattr(model.role, 'value') else model.role),
            password_hash=model.password_hash,
            created_at=model.created_at,
            updated_at=model.updated_at,
            deleted_at=model.deleted_at,
        )

    def _to_model(self, entity: UserEntity) -> UserModel:
        return UserModel(
            id=entity.id,
            email=entity.email,
            student_id=entity.student_id,
            full_name=entity.full_name,
            role=entity.role,
            password_hash=entity.password_hash,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            deleted_at=entity.deleted_at,
        )

    def get_by_id(self, user_id: uuid.UUID) -> Optional[UserEntity]:
        stmt = select(UserModel).where(UserModel.id == user_id, UserModel.deleted_at.is_(None))
        result = self._session.execute(stmt).scalar_one_or_none()
        if result:
            return self._to_entity(result)
        return None

    def get_by_email(self, email: str) -> Optional[UserEntity]:
        stmt = select(UserModel).where(UserModel.email == email, UserModel.deleted_at.is_(None))
        result = self._session.execute(stmt).scalar_one_or_none()
        if result:
            return self._to_entity(result)
        return None

    def save(self, user: UserEntity) -> UserEntity:
        model = self._to_model(user)
        # Using merge allows saving both new entities and updates
        merged_model = self._session.merge(model)
        self._session.commit()
        return self._to_entity(merged_model)

    def list_all(self, page: int, size: int, query: str = "") -> tuple[list[UserEntity], int]:
        stmt = select(UserModel)
        if query:
            stmt = stmt.where(
                (UserModel.email.ilike(f"%{query}%")) | 
                (UserModel.full_name.ilike(f"%{query}%")) |
                (UserModel.student_id.ilike(f"%{query}%"))
            )
        
        # count using func.count (fixes memory leak issue #1)
        from sqlalchemy import func
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self._session.execute(count_stmt).scalar() or 0

        # paginate
        stmt = stmt.order_by(UserModel.created_at.desc()).offset((page - 1) * size).limit(size)
        models = self._session.execute(stmt).scalars().all()
        return [self._to_entity(m) for m in models], total

    def update_status(self, user_id: uuid.UUID, is_active: bool) -> bool:
        stmt = select(UserModel).where(UserModel.id == user_id)
        user = self._session.execute(stmt).scalar_one_or_none()
        if not user:
            return False
            
        if is_active:
            user.deleted_at = None
        else:
            if not user.deleted_at:
                user.deleted_at = datetime.now(tz=timezone.utc)
                
        self._session.add(user)
        self._session.commit()
        return True
