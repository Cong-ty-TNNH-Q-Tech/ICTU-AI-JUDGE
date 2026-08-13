from app.domain.entities.entities import ChallengeEntity
from app.application.dtos.challenge_dtos import ChallengeResponseDTO
from app.application.dtos.tag_dtos import TagResponseDTO

def challenge_to_dto(entity: ChallengeEntity, is_admin: bool = False) -> ChallengeResponseDTO:
    return ChallengeResponseDTO(
        id=entity.id,
        title=entity.title,
        description=entity.description,
        type=entity.type,
        status=entity.status,
        start_time=entity.start_time,
        end_time=entity.end_time,
        rate_limit_minutes=entity.rate_limit_minutes,
        max_file_size_mb=entity.max_file_size_mb,
        metric_name=entity.metric_name,
        metric_direction=entity.metric_direction,
        created_by=entity.created_by,
        created_at=entity.created_at,
        dataset_url=entity.dataset_url,
        ground_truth_url=entity.ground_truth_url if is_admin else None,
        custom_metric_url=entity.custom_metric_url if is_admin else None,
        team_lock_deadline=entity.team_lock_deadline,
        max_team_size=entity.max_team_size,
        parent_id=entity.parent_id,
        contest_id=entity.contest_id,
        environment_image=entity.environment_image,
        require_gpu=entity.require_gpu,
        tags=[
            TagResponseDTO(id=t.id, name=t.name, color_hex=t.color_hex, created_at=t.created_at)
            for t in entity.tags
        ],
    )
