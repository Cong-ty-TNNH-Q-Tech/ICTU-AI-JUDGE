from typing import Optional
import uuid

from pydantic import BaseModel, Field, AwareDatetime

from app.domain.entities.entities import ContestStatus
from app.application.dtos.challenge_dtos import ChallengeResponseDTO


class ContestCreateDTO(BaseModel):
    title: str = Field(..., max_length=500)
    description: str = Field(default="", max_length=10000)
    status: ContestStatus = ContestStatus.DRAFT
    start_time: AwareDatetime
    end_time: Optional[AwareDatetime] = None


class ContestUpdateDTO(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None, max_length=10000)
    status: Optional[ContestStatus] = None
    start_time: Optional[AwareDatetime] = None
    end_time: Optional[AwareDatetime] = None


class ContestResponseDTO(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    status: ContestStatus  # Enum type → OpenAPI spec đúng, type-safe
    start_time: AwareDatetime
    end_time: Optional[AwareDatetime] = None
    created_at: AwareDatetime
    created_by: uuid.UUID

    model_config = {"from_attributes": True}


class ContestListResponseDTO(BaseModel):
    items: list[ContestResponseDTO]
    total: int
    page: int
    size: int
    total_pages: int


class ContestChallengesResponseDTO(BaseModel):
    """Response cho GET /contests/{id}/challenges — danh sách challenges con."""
    contest_id: uuid.UUID
    items: list[ChallengeResponseDTO]  # ChallengeResponseDTO là Pydantic model → không cần arbitrary_types_allowed
    total: int
