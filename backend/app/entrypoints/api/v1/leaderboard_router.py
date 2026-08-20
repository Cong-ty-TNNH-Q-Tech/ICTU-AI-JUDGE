"""
Leaderboard Router — UC07.
[OWNER] Thành viên phụ trách: Leaderboard Module
"""
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

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
    try:
        current_time = datetime.now(tz=timezone.utc)
        return use_case.get_leaderboard(
            challenge_id=challenge_id,
            lb_type=type,
            page=page,
            size=size,
            current_time=current_time,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.get("/{challenge_id}/contest-leaderboard")
async def get_contest_leaderboard(
    challenge_id: uuid.UUID,
    type: LeaderboardType = LeaderboardType.PUBLIC,
    use_case: LeaderboardUseCase = Depends(get_leaderboard_use_case),
):
    """Bảng xếp hạng tổng của một Contest (Parent Challenge)."""
    try:
        current_time = datetime.now(tz=timezone.utc)
        return use_case.get_contest_leaderboard(
            contest_id=challenge_id,
            lb_type=type,
            current_time=current_time,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
