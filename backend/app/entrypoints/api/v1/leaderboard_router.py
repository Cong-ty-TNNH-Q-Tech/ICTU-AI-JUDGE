"""
Leaderboard Router — UC07.
[OWNER] Thành viên phụ trách: Leaderboard Module
"""
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.application.dtos.leaderboard_dtos import LeaderboardResponseDTO, LeaderboardType
from app.application.use_cases.leaderboard_use_case import LeaderboardUseCase
from app.entrypoints.dependencies import get_leaderboard_use_case

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/{challenge_id}/leaderboard", response_model=LeaderboardResponseDTO)
async def get_leaderboard(
    challenge_id: uuid.UUID,
    type: LeaderboardType = LeaderboardType.PUBLIC,
    page: int = 1,
    size: int = 20,
    use_case: LeaderboardUseCase = Depends(get_leaderboard_use_case),
):
    """UC07 — Bảng xếp hạng Public/Private (phân trang)."""
    current_time = datetime.now(tz=timezone.utc)
    return use_case.get_leaderboard(
        challenge_id=challenge_id,
        lb_type=type,
        page=page,
        size=size,
        current_time=current_time,
    )
