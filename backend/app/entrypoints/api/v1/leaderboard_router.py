"""
Leaderboard Router — UC07.
[OWNER] Thành viên phụ trách: Leaderboard Module
"""
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.adapters.database.challenge_repository import SQLChallengeRepository
from app.adapters.database.leaderboard_repository import SQLLeaderboardRepository
from app.application.dtos.leaderboard_dtos import LeaderboardResponseDTO, LeaderboardType
from app.application.use_cases.leaderboard_use_case import LeaderboardUseCase
from app.entrypoints.dependencies import get_db

logger = logging.getLogger(__name__)
router = APIRouter()

def _get_leaderboard_use_case(db: Session) -> LeaderboardUseCase:
    return LeaderboardUseCase(
        leaderboard_repo=SQLLeaderboardRepository(db),
        challenge_repo=SQLChallengeRepository(db),
    )

@router.get("/{challenge_id}", response_model=LeaderboardResponseDTO)
async def get_leaderboard(
    challenge_id: uuid.UUID,
    type: LeaderboardType = LeaderboardType.PUBLIC,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
):
    """UC07 — Bảng xếp hạng Public/Private (phân trang)."""
    use_case = _get_leaderboard_use_case(db)
    current_time = datetime.now(tz=timezone.utc)
    return use_case.get_leaderboard(
        challenge_id=challenge_id,
        lb_type=type,
        page=page,
        size=size,
        current_time=current_time,
    )
