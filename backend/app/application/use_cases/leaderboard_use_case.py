"""
Leaderboard Use Case.
"""
import uuid
from datetime import datetime, timezone

from app.application.dtos.challenge_dtos import (
    ChallengeResponseDTO,
    ContestLeaderboardEntryDTO,
    ContestLeaderboardResponseDTO,
)
from app.application.dtos.leaderboard_dtos import (
    LeaderboardEntryDTO,
    LeaderboardResponseDTO,
    LeaderboardType,
)
from app.application.dtos.tag_dtos import TagResponseDTO
from app.application.interfaces.repositories import (
    IChallengeRepository,
    IContestRepository,
    ILeaderboardRepository,
    ITeamRepository,
)
from app.domain.entities.entities import MetricDirection


class LeaderboardUseCase:
    def __init__(
        self,
        leaderboard_repo: ILeaderboardRepository,
        challenge_repo: IChallengeRepository,
        contest_repo: IContestRepository,
        team_repo: ITeamRepository,
    ):
        self.leaderboard_repo = leaderboard_repo
        self.challenge_repo = challenge_repo
        self.contest_repo = contest_repo
        self.team_repo = team_repo

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
            if challenge.end_time is None:
                raise PermissionError("Challenge không giới hạn thời gian không hỗ trợ Private Leaderboard.")
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
                entries=entity.entries,
                last_submission_time=entity.last_submission_time,
                is_selected_for_private=entity.best_private_submission_id is not None
            )
            data.append(dto)

        return LeaderboardResponseDTO(
            total=total,
            page=page,
            size=size,
            items=data,
        )

    def get_contest_leaderboard(
        self,
        contest_id: uuid.UUID,
        lb_type: LeaderboardType,
        current_time: datetime,
    ) -> ContestLeaderboardResponseDTO:
        contest = self.contest_repo.get_by_id(contest_id)
        if not contest:
            raise ValueError("Contest not found")
            
        if lb_type == LeaderboardType.PRIVATE:
            if contest.end_time is None:
                raise PermissionError("Contest không giới hạn thời gian không hỗ trợ Private Leaderboard.")
            if current_time <= contest.end_time:
                raise PermissionError("Private leaderboard is only available after contest ends")

        children = self.challenge_repo.get_children(contest_id)
        
        # Build child DTOs
        child_dtos = []
        for child in children:
            child_dtos.append(
                ChallengeResponseDTO(
                    id=child.id,
                    title=child.title,
                    description=child.description,
                    type=child.type,
                    status=child.status,
                    start_time=child.start_time,
                    end_time=child.end_time,
                    rate_limit_minutes=child.rate_limit_minutes,
                    max_file_size_mb=child.max_file_size_mb,
                    metric_name=child.metric_name,
                    metric_direction=child.metric_direction,
                    created_by=child.created_by,
                    created_at=child.created_at,
                    dataset_url=child.dataset_url,
                    ground_truth_url=None,
                    custom_metric_url=None,
                    team_lock_deadline=child.team_lock_deadline,
                    max_team_size=child.max_team_size,
                    parent_id=child.parent_id,
                    environment_image=child.environment_image,
                    require_gpu=child.require_gpu,
                    tags=[TagResponseDTO.model_validate(t) for t in child.tags]
                )
            )

        child_ids = [c.id for c in children]
        valid_challenge_ids = child_ids + [contest_id]

        # 1. Get all teams for contest and children
        teams = self.team_repo.get_teams_by_challenges(valid_challenge_ids)
        team_dict = {t.id: t.name for t in teams}

        # 2. Get all leaderboard entries for children
        entries = self.leaderboard_repo.get_by_challenges(child_ids)

        # 3. Aggregate scores
        # scores_map: dict[team_id, dict[challenge_id, float]]
        scores_map: dict[uuid.UUID, dict[uuid.UUID, float]] = {t_id: {} for t_id in team_dict.keys()}
        last_submission_map: dict[uuid.UUID, datetime] = {}
        
        for entry in entries:
            if entry.team_id in scores_map:
                score = entry.best_private_score if lb_type == LeaderboardType.PRIVATE else entry.best_public_score
                if score is None:
                    # Fallback to public score if private is None
                    score = entry.best_public_score
                scores_map[entry.team_id][entry.challenge_id] = score
                
                # Update last submission time for tie-break
                if entry.team_id not in last_submission_map or entry.last_submission_time > last_submission_map[entry.team_id]:
                    last_submission_map[entry.team_id] = entry.last_submission_time

        # 4. Calculate total score and fallback for missing entries
        leaderboard = []
        for team_id, team_name in team_dict.items():
            total_score = 0.0
            team_scores = {}
            for child in children:
                if child.id in scores_map[team_id]:
                    score = scores_map[team_id][child.id]
                else:
                    # Fallback logic
                    score = 0.0 if child.metric_direction == MetricDirection.HIGHER_IS_BETTER else 999999.0
                
                team_scores[child.id] = score
                total_score += score
            
            leaderboard.append(
                ContestLeaderboardEntryDTO(
                    team_id=team_id,
                    team_name=team_name,
                    total_score=total_score,
                    scores=team_scores,
                    rank=0  # will calculate later
                )
            )

        # 5. Sort leaderboard based on total score (sum) and tie-break on time
        is_higher_better = contest.metric_direction == MetricDirection.HIGHER_IS_BETTER
        
        # Tie break: if same score, the team with earlier last_submission_time wins.
        # If no submission time (didn't submit anything), fallback to max datetime.
        max_time = datetime.max.replace(tzinfo=timezone.utc) if current_time.tzinfo else datetime.max
        leaderboard.sort(
            key=lambda x: (
                -x.total_score if is_higher_better else x.total_score,
                last_submission_map.get(x.team_id, max_time).timestamp()
            )
        )

        # 6. Assign ranks
        rank = 1
        for entry in leaderboard:
            entry.rank = rank
            rank += 1

        return ContestLeaderboardResponseDTO(
            contest_id=contest_id,
            child_challenges=child_dtos,
            leaderboard=leaderboard
        )
