"""
Leaderboard Use Case.
"""
import uuid
from datetime import datetime
from typing import Optional

from app.application.dtos.leaderboard_dtos import (
    LeaderboardEntryDTO,
    LeaderboardResponseDTO,
    LeaderboardType,
)
from app.application.interfaces.repositories import (
    IChallengeRepository,
    ILeaderboardRepository,
)


class LeaderboardUseCase:
    def __init__(
        self,
        leaderboard_repo: ILeaderboardRepository,
        challenge_repo: IChallengeRepository,
    ):
        self.leaderboard_repo = leaderboard_repo
        self.challenge_repo = challenge_repo

    def get_leaderboard(
        self,
        challenge_id: uuid.UUID,
        lb_type: LeaderboardType,
        page: int,
        size: int,
        current_time: datetime,
    ) -> LeaderboardResponseDTO:
        
        challenge = self.challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")
            
        if lb_type == LeaderboardType.PRIVATE:
            if current_time <= challenge.end_time:
                raise PermissionError("Private leaderboard is only available after challenge ends")
            
            items, total = self.leaderboard_repo.list_private(
                challenge_id=challenge_id,
                page=page,
                size=size,
                direction=challenge.metric_direction
            )
        else:
            items, total = self.leaderboard_repo.list_public(
                challenge_id=challenge_id,
                page=page,
                size=size,
                direction=challenge.metric_direction
            )

        data = []
        for entity, team_name in items:
            dto = LeaderboardEntryDTO(
                rank=entity.rank,
                team_id=entity.team_id,
                team_name=team_name,
                best_public_score=entity.best_public_score,
                best_private_score=entity.best_private_score if lb_type == LeaderboardType.PRIVATE else None,
                last_submission_time=entity.last_submission_time,
                is_selected_for_private=entity.best_private_submission_id is not None
            )
            data.append(dto)

        return LeaderboardResponseDTO(
            total_count=total,
            page=page,
            size=size,
            data=data,
        )
