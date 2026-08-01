"""
Password Reset Repository — Adapter/Database layer.
Implements IPasswordResetRepository.
"""
import uuid
from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.adapters.database.models import PasswordResetModel
from app.application.interfaces.repositories import IPasswordResetRepository
from app.domain.entities.entities import PasswordResetEntity


class PasswordResetRepository(IPasswordResetRepository):
    def __init__(self, session: Session):
        self._session = session

    def _to_entity(self, model: PasswordResetModel) -> PasswordResetEntity:
        return PasswordResetEntity(
            id=model.id,
            user_id=model.user_id,
            token=model.token,
            expires_at=model.expires_at,
            used=model.used,
        )

    def save(self, reset_entity: PasswordResetEntity) -> PasswordResetEntity:
        model = PasswordResetModel(
            id=reset_entity.id,
            user_id=reset_entity.user_id,
            token=reset_entity.token,
            expires_at=reset_entity.expires_at,
            used=reset_entity.used,
        )
        self._session.add(model)
        self._session.flush()
        return self._to_entity(model)

    def get_by_token(self, token: str) -> Optional[PasswordResetEntity]:
        stmt = select(PasswordResetModel).where(PasswordResetModel.token == token)
        result = self._session.execute(stmt).scalars().first()
        if not result:
            return None
        return self._to_entity(result)

    def mark_as_used(self, token_id: uuid.UUID) -> None:
        stmt = (
            update(PasswordResetModel)
            .where(PasswordResetModel.id == token_id)
            .values(used=True)
        )
        self._session.execute(stmt)
        self._session.flush()
