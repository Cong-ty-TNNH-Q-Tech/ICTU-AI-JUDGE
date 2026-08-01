from typing import Optional
import uuid

from pydantic import BaseModel, Field, AwareDatetime

from app.domain.entities.entities import ContestStatus
from app.application.dtos.challenge_dtos import ChallengeResponseDTO


class ContestCreateDTO(BaseModel):
    title: str = Field(..., max_length=500)
    description: str = Field(default="")
    status: ContestStatus = ContestStatus.DRAFT
    start_time: AwareDatetime
    end_time: Optional[AwareDatetime] = None


class ContestUpdateDTO(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    status: Optional[ContestStatus] = None
    start_time: Optional[AwareDatetime] = None
    end_time: Optional[AwareDatetime] = None


class ContestResponseDTO(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    status: str
    start_time: AwareDatetime
    end_time: Optional[AwareDatetime] = None
    created_at: AwareDatetime
    created_by: uuid.UUID


class ContestListResponseDTO(BaseModel):
    items: list[ContestResponseDTO]
    total: int
    page: int
    size: int
    total_pages: int


class ContestChallengesResponseDTO(BaseModel):
    """Response cho GET /contests/{id}/challenges — danh sách challenges con."""
    contest_id: uuid.UUID
    items: list[ChallengeResponseDTO]
    total: int
