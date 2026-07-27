"""
Leaderboard DTOs (Data Transfer Objects).
"""
import uuid
from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class LeaderboardType(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"


class LeaderboardEntryDTO(BaseModel):
    rank: int
    team_id: uuid.UUID
    team_name: str
    best_public_score: float
    best_private_score: Optional[float] = None
    last_submission_time: datetime
    is_selected_for_private: bool = False


class LeaderboardResponseDTO(BaseModel):
    total_count: int
    page: int
    size: int
    data: List[LeaderboardEntryDTO]
