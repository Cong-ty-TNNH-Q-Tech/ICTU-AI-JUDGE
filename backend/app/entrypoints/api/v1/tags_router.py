import uuid

from fastapi import APIRouter, Depends, status

from app.application.dtos.tag_dtos import TagCreateRequestDTO, TagUpdateRequestDTO, TagResponseDTO
from app.application.use_cases.tag_use_case import TagUseCase
from app.entrypoints.dependencies import get_current_admin, get_tag_use_case

router = APIRouter(prefix="/tags", tags=["Tags"])

@router.get("", response_model=list[TagResponseDTO])
def list_tags(
    tag_use_case: TagUseCase = Depends(get_tag_use_case)
):
    return tag_use_case.list_tags()

@router.post("", response_model=TagResponseDTO, status_code=status.HTTP_201_CREATED)
def create_tag(
    data: TagCreateRequestDTO,
    _: dict = Depends(get_current_admin),
    tag_use_case: TagUseCase = Depends(get_tag_use_case)
):
    return tag_use_case.create_tag(data)

@router.put("/{tag_id}", response_model=TagResponseDTO)
def update_tag(
    tag_id: uuid.UUID,
    data: TagUpdateRequestDTO,
    _: dict = Depends(get_current_admin),
    tag_use_case: TagUseCase = Depends(get_tag_use_case)
):
    return tag_use_case.update_tag(tag_id, data)

@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: uuid.UUID,
    _: dict = Depends(get_current_admin),
    tag_use_case: TagUseCase = Depends(get_tag_use_case)
):
    tag_use_case.delete_tag(tag_id)
