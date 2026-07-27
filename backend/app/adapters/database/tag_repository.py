import uuid
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.application.interfaces.repositories import ITagRepository
from app.domain.entities.entities import TagEntity
from app.adapters.database.models import TagModel

class SQLTagRepository(ITagRepository):
    def __init__(self, session: Session):
        self.session = session

    def _to_entity(self, model: TagModel) -> TagEntity:
        return TagEntity(
            id=model.id,
            name=model.name,
            color_hex=model.color_hex,
            created_at=model.created_at
        )

    def _to_model(self, entity: TagEntity) -> TagModel:
        return TagModel(
            id=entity.id,
            name=entity.name,
            color_hex=entity.color_hex,
            created_at=entity.created_at
        )

    def get_by_id(self, tag_id: uuid.UUID) -> Optional[TagEntity]:
        stmt = select(TagModel).where(TagModel.id == tag_id)
        model = self.session.execute(stmt).scalar_one_or_none()
        if not model:
            return None
        return self._to_entity(model)

    def get_by_name(self, name: str) -> Optional[TagEntity]:
        stmt = select(TagModel).where(TagModel.name == name)
        model = self.session.execute(stmt).scalar_one_or_none()
        if not model:
            return None
        return self._to_entity(model)

    def get_by_ids(self, tag_ids: list[uuid.UUID]) -> list[TagEntity]:
        if not tag_ids:
            return []
        stmt = select(TagModel).where(TagModel.id.in_(tag_ids))
        models = self.session.execute(stmt).scalars().all()
        return [self._to_entity(model) for model in models]

    def save(self, tag: TagEntity) -> TagEntity:
        model = self._to_model(tag)
        self.session.add(model)
        self.session.flush()
        return self._to_entity(model)

    def update(self, tag: TagEntity) -> TagEntity:
        model = self.session.get(TagModel, tag.id)
        if model:
            model.name = tag.name
            model.color_hex = tag.color_hex
            self.session.flush()
        return tag

    def delete(self, tag_id: uuid.UUID) -> None:
        model = self.session.get(TagModel, tag_id)
        if model:
            self.session.delete(model)
            self.session.flush()

    def list_all(self) -> list[TagEntity]:
        stmt = select(TagModel).order_by(TagModel.name)
        models = self.session.execute(stmt).scalars().all()
        return [self._to_entity(model) for model in models]
