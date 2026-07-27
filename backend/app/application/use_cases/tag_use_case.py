import uuid
from datetime import datetime

from app.application.dtos.tag_dtos import TagCreateRequestDTO, TagUpdateRequestDTO, TagResponseDTO
from app.application.interfaces.repositories import IUnitOfWork, ITagRepository
from app.domain.entities.entities import TagEntity
from app.domain.exceptions.exceptions import NotFoundError

class TagUseCase:
    def __init__(self, uow: IUnitOfWork, tag_repo: ITagRepository):
        self.uow = uow
        self.tag_repo = tag_repo

    def create_tag(self, dto: TagCreateRequestDTO) -> TagResponseDTO:
        existing = self.tag_repo.get_by_name(dto.name)
        if existing:
            raise ValueError(f"Tag with name {dto.name} already exists")
        
        entity = TagEntity(
            id=uuid.uuid4(),
            name=dto.name,
            color_hex=dto.color_hex,
            created_at=datetime.utcnow()
        )
        saved = self.tag_repo.save(entity)
        self.uow.commit()
        return TagResponseDTO.model_validate(saved)

    def update_tag(self, tag_id: uuid.UUID, dto: TagUpdateRequestDTO) -> TagResponseDTO:
        tag = self.tag_repo.get_by_id(tag_id)
        if not tag:
            raise NotFoundError(f"Tag {tag_id} not found")
        
        if dto.name and dto.name != tag.name:
            existing = self.tag_repo.get_by_name(dto.name)
            if existing:
                raise ValueError(f"Tag with name {dto.name} already exists")
            tag.name = dto.name
        
        if dto.color_hex:
            tag.color_hex = dto.color_hex
            
        updated = self.tag_repo.update(tag)
        self.uow.commit()
        return TagResponseDTO.model_validate(updated)

    def delete_tag(self, tag_id: uuid.UUID) -> None:
        tag = self.tag_repo.get_by_id(tag_id)
        if not tag:
            raise NotFoundError(f"Tag {tag_id} not found")
        
        self.tag_repo.delete(tag_id)
        self.uow.commit()

    def list_tags(self) -> list[TagResponseDTO]:
        tags = self.tag_repo.list_all()
        return [TagResponseDTO.model_validate(tag) for tag in tags]
