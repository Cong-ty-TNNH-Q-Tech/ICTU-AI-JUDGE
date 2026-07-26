import uuid
from typing import Dict, Any
from app.application.interfaces.repositories import IChallengeRepository
from app.domain.entities.entities import ChallengeEntity

class ChallengeUseCase:
    """
    Challenge Use Case.
    Orchestrates business rules and repository interactions for Challenge entity.
    """
    def __init__(self, challenge_repo: IChallengeRepository):
        self.challenge_repo = challenge_repo

    def list_challenges(self, page: int, size: int, status_filter: str | None = None) -> Dict[str, Any]:
        """Lấy danh sách bài thi."""
        items, total = self.challenge_repo.list_all(page=page, size=size, status_filter=status_filter)
        return {
            "items": items,
            "total": total,
            "page": page,
            "size": size,
        }

    def get_challenge(self, challenge_id: uuid.UUID) -> ChallengeEntity | None:
        """Lấy chi tiết 1 bài thi."""
        return self.challenge_repo.get_by_id(challenge_id)
