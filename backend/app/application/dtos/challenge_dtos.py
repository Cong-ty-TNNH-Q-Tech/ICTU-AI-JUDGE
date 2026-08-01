import uuid
from typing import Optional

from pydantic import BaseModel, Field, AwareDatetime

from app.domain.entities.entities import ChallengeStatus, ChallengeType, MetricDirection
from app.application.dtos.tag_dtos import TagResponseDTO


class ChallengeCreateRequestDTO(BaseModel):
    title: str = Field(..., max_length=255)
    description: str = Field(..., min_length=1)
    type: ChallengeType
    start_time: AwareDatetime
    end_time: Optional[AwareDatetime] = None
    rate_limit_minutes: int = Field(default=30, ge=1)
    max_file_size_mb: int = Field(default=5, ge=1, le=50)
    metric_name: str = Field(..., max_length=50)
    metric_direction: MetricDirection
    dataset_url: Optional[str] = None
    team_lock_deadline: Optional[AwareDatetime] = None
    max_team_size: int = Field(default=5, ge=1)
    tag_ids: Optional[list[uuid.UUID]] = None
    parent_id: Optional[uuid.UUID] = None

class ChallengeUpdateRequestDTO(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    status: Optional[ChallengeStatus] = None
    start_time: Optional[AwareDatetime] = None
    end_time: Optional[AwareDatetime] = None
    rate_limit_minutes: Optional[int] = Field(None, ge=1)
    max_file_size_mb: Optional[int] = Field(None, ge=1, le=50)
    metric_name: Optional[str] = Field(None, max_length=50)
    metric_direction: Optional[MetricDirection] = None
    dataset_url: Optional[str] = None
    team_lock_deadline: Optional[AwareDatetime] = None
    max_team_size: Optional[int] = Field(None, ge=1)
    tag_ids: Optional[list[uuid.UUID]] = None
    parent_id: Optional[uuid.UUID] = None

class ChallengeResponseDTO(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    type: ChallengeType
    status: ChallengeStatus
    start_time: AwareDatetime
    end_time: Optional[AwareDatetime] = None
    rate_limit_minutes: int
    max_file_size_mb: int
    metric_name: str
    metric_direction: MetricDirection
    created_by: uuid.UUID
    created_at: AwareDatetime
    dataset_url: str
    # ground_truth_url sẽ bị None nếu là sinh viên
    ground_truth_url: Optional[str] = None
    custom_metric_url: Optional[str] = None
    team_lock_deadline: Optional[AwareDatetime] = None
    max_team_size: int
    parent_id: Optional[uuid.UUID] = None
    contest_id: Optional[uuid.UUID] = None
    tags: list[TagResponseDTO] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ChallengeListResponseDTO(BaseModel):
    items: list[ChallengeResponseDTO]
    total: int
    page: int
    size: int


class ContestLeaderboardEntryDTO(BaseModel):
    team_id: uuid.UUID
    team_name: str
    total_score: float
    scores: dict[uuid.UUID, float]  # challenge_id -> score
    rank: int


class ContestLeaderboardResponseDTO(BaseModel):
    contest_id: uuid.UUID
    child_challenges: list[ChallengeResponseDTO]
    leaderboard: list[ContestLeaderboardEntryDTO]

