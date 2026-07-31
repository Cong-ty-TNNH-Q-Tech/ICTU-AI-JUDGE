"""
Router package — API v1.
Mỗi router là 1 file riêng để thành viên làm việc độc lập, tránh conflicts.
"""
from app.entrypoints.api.v1 import (
    admin_router,
    auth_router,
    challenges_router,
    leaderboard_router,
    submissions_router,
    teams_router,
    tags_router,
    contests_router,
)

__all__ = [
    "auth_router",
    "users_router",
    "challenges_router",
    "teams_router",
    "submissions_router",
    "leaderboard_router",
    "admin_router",
    "tags_router",
    "contests_router",
]
