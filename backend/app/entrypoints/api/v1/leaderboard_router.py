"""
Leaderboard Router — UC07.
[OWNER] Thành viên phụ trách: Leaderboard Module
Note: Leaderboard endpoint chính đã được mount tại /challenges/{id}/leaderboard
      File này reserve cho các endpoint leaderboard bổ sung trong tương lai nếu cần.
"""
from fastapi import APIRouter

router = APIRouter()
