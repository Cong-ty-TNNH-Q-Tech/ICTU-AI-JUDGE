"""
Repository Interfaces (Outbound Ports) — Application layer.
Use Cases chỉ giao tiếp với DB thông qua các interface này.
Adapter (database/) implement các interface này.
"""
import uuid
from abc import ABC, abstractmethod
from datetime import datetime

from app.domain.entities.entities import (
    ChallengeEntity,
    LeaderboardEntryEntity,
    SubmissionEntity,
    SubmissionStatus,
    TeamEntity,
    UserEntity,
)


class IUserRepository(ABC):
    @abstractmethod
    def get_by_id(self, user_id: uuid.UUID) -> UserEntity | None: ...

    @abstractmethod
    def get_by_email(self, email: str) -> UserEntity | None: ...

    @abstractmethod
    def save(self, user: UserEntity) -> UserEntity: ...

    @abstractmethod
    def list_all(self, page: int, size: int, query: str = "") -> tuple[list[UserEntity], int]: ...

    @abstractmethod
    def soft_delete(self, user_id: uuid.UUID) -> None: ...


class IChallengeRepository(ABC):
    @abstractmethod
    def get_by_id(self, challenge_id: uuid.UUID) -> ChallengeEntity | None: ...

    @abstractmethod
    def save(self, challenge: ChallengeEntity) -> ChallengeEntity: ...

    @abstractmethod
    def update(self, challenge: ChallengeEntity) -> ChallengeEntity: ...

    @abstractmethod
    def soft_delete(self, challenge_id: uuid.UUID) -> None: ...

    @abstractmethod
    def list_all(
        self, page: int, size: int, status_filter: str | None = None
    ) -> tuple[list[ChallengeEntity], int]: ...

    @abstractmethod
    def has_successful_submission(self, challenge_id: uuid.UUID) -> bool: ...


class ITeamRepository(ABC):
    @abstractmethod
    def get_by_id(self, team_id: uuid.UUID) -> TeamEntity | None: ...

    @abstractmethod
    def get_by_challenge_and_user(
        self, challenge_id: uuid.UUID, user_id: uuid.UUID
    ) -> TeamEntity | None: ...

    @abstractmethod
    def save(self, team: TeamEntity) -> TeamEntity: ...

    @abstractmethod
    def has_submissions(self, team_id: uuid.UUID) -> bool: ...


class ISubmissionRepository(ABC):
    @abstractmethod
    def get_by_id(self, submission_id: uuid.UUID) -> SubmissionEntity | None: ...

    @abstractmethod
    def save(self, submission: SubmissionEntity) -> SubmissionEntity: ...

    @abstractmethod
    def update_status(
        self,
        submission_id: uuid.UUID,
        status: SubmissionStatus,
        public_score: float | None = None,
        private_score: float | None = None,
        execution_time_ms: int | None = None,
        error_message: str | None = None,
    ) -> None: ...

    @abstractmethod
    def get_last_submission_time(
        self, team_id: uuid.UUID, challenge_id: uuid.UUID
    ) -> datetime | None: ...

    @abstractmethod
    def exists_by_hash(
        self, team_id: uuid.UUID, challenge_id: uuid.UUID, md5_hash: str
    ) -> bool: ...

    @abstractmethod
    def list_by_team(
        self, team_id: uuid.UUID, challenge_id: uuid.UUID, page: int, size: int
    ) -> tuple[list[SubmissionEntity], int]: ...

    @abstractmethod
    def list_stale_processing(
        self, older_than: datetime
    ) -> list[SubmissionEntity]: ...

    @abstractmethod
    def get_stale_submissions(
        self, older_than: datetime
    ) -> list[SubmissionEntity]: ...

    @abstractmethod
    def nullify_file_urls(
        self, submission_ids: list[uuid.UUID]
    ) -> None: ...


class ILeaderboardRepository(ABC):
    @abstractmethod
    def get_by_team_and_challenge(
        self, team_id: uuid.UUID, challenge_id: uuid.UUID
    ) -> LeaderboardEntryEntity | None: ...

    @abstractmethod
    def upsert_with_lock(
        self, entry: LeaderboardEntryEntity
    ) -> LeaderboardEntryEntity:
        """
        [CHỐNG RACE CONDITION] Bắt buộc dùng SELECT ... FOR UPDATE (Pessimistic Locking)
        trong implementation SQLAlchemy trước khi ghi đè kỷ lục.
        """
        ...

    @abstractmethod
    def list_public(
        self, challenge_id: uuid.UUID, page: int, size: int
    ) -> tuple[list[LeaderboardEntryEntity], int]: ...

    @abstractmethod
    def list_private(
        self, challenge_id: uuid.UUID, page: int, size: int
    ) -> tuple[list[LeaderboardEntryEntity], int]: ...


class IStorageRepository(ABC):
    @abstractmethod
    def upload(self, key: str, data: bytes, content_type: str = "text/csv") -> str:
        """Upload file lên S3/MinIO, trả về presigned URL hoặc internal path."""
        ...

    @abstractmethod
    def download(self, key: str) -> bytes: ...

    @abstractmethod
    def delete(self, key: str) -> None: ...
