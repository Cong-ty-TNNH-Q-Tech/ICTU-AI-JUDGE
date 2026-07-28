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
    TeamInviteEntity,
    UserEntity,
    MetricDirection,
    InviteStatus,
    SolutionEntity,
    TagEntity,
)


class IUnitOfWork(ABC):
    """
    Unit of Work pattern cho quản lý transaction.
    """
    @abstractmethod
    def commit(self) -> None: ...

    @abstractmethod
    def rollback(self) -> None: ...


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
    def update_status(self, user_id: uuid.UUID, is_active: bool) -> bool: ...

    @abstractmethod
    def update_profile(
        self,
        user_id: uuid.UUID,
        github_url: str | None,
        linkedin_url: str | None,
        avatar_url: str | None = ...,  # type: ignore[assignment]
    ) -> UserEntity | None:
        """
        Cập nhật thông tin profile (github_url, linkedin_url, avatar_url).
        Dùng atomic SQL UPDATE — an toàn đồng thời.
        Trả về entity sau khi cập nhật, None nếu user không tồn tại.
        """
        ...

    @abstractmethod
    def get_profile_stats(self, user_id: uuid.UUID) -> dict:
        """
        Lấy thống kê tổng hợp của user:
        { total_submissions, total_solutions, best_rank }
        Thực hiện trong 3 COUNT query riêng biệt (đơn giản, dễ index).
        """
        ...

    @abstractmethod
    def update_avatar(self, user_id: uuid.UUID, avatar_s3_key: str) -> "UserEntity | None":
        """Atomic update chỉ trường avatar_url — dùng sau khi upload thành công."""
        ...



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
        self, page: int, size: int, status_filter: str | None = None, tag_id: uuid.UUID | None = None
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

    @abstractmethod
    def create_invite(self, team_id: uuid.UUID, inviter_id: uuid.UUID, token: str, expires_at: datetime) -> str: ...

    @abstractmethod
    def get_invite_by_token(self, token: str) -> "TeamInviteEntity | None": ...

    @abstractmethod
    def update_invite_status(self, token: str, status: "InviteStatus") -> None: ...

    @abstractmethod
    def add_member(self, team_id: uuid.UUID, user_id: uuid.UUID) -> None: ...

    @abstractmethod
    def delete(self, team_id: uuid.UUID) -> None: ...

    @abstractmethod
    def invalidate_invites(self, team_id: uuid.UUID) -> None: ...


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

    @abstractmethod
    def clear_selected_for_private(
        self, team_id: uuid.UUID, challenge_id: uuid.UUID
    ) -> None:
        """UC05 — Bỏ chọn tất cả submission trước đó của team trong challenge."""
        ...

    @abstractmethod
    def set_selected_for_private(
        self, submission_id: uuid.UUID, value: bool
    ) -> None:
        """UC05 — Set is_selected_for_private cho một submission cụ thể."""
        ...

    @abstractmethod
    def update_source_code_url(
        self, submission_id: uuid.UUID, source_code_url: str
    ) -> None:
        """UC06 — Cập nhật đường dẫn source code sau khi upload."""
        ...

    @abstractmethod
    def list_all_by_challenge(
        self, challenge_id: uuid.UUID, page: int, size: int
    ) -> tuple[list[SubmissionEntity], int]:
        """UC11 (Admin) — Lấy tất cả bài nộp trong một Challenge."""
        ...


class ILeaderboardRepository(ABC):
    @abstractmethod
    def get_by_team_and_challenge(
        self, team_id: uuid.UUID, challenge_id: uuid.UUID
    ) -> LeaderboardEntryEntity | None: ...

    @abstractmethod
    def upsert_with_lock(
        self, entry: LeaderboardEntryEntity, direction: MetricDirection = MetricDirection.HIGHER_IS_BETTER
    ) -> LeaderboardEntryEntity:
        """
        [CHỐNG RACE CONDITION] Bắt buộc dùng SELECT ... FOR UPDATE (Pessimistic Locking)
        trong implementation SQLAlchemy trước khi ghi đè kỷ lục.
        """
        ...

    @abstractmethod
    def list_public(
        self, challenge_id: uuid.UUID, page: int, size: int, direction: MetricDirection = MetricDirection.HIGHER_IS_BETTER
    ) -> tuple[list[tuple[LeaderboardEntryEntity, str]], int]: ...

    @abstractmethod
    def list_private(
        self, challenge_id: uuid.UUID, page: int, size: int, direction: MetricDirection = MetricDirection.HIGHER_IS_BETTER
    ) -> tuple[list[tuple[LeaderboardEntryEntity, str]], int]: ...

    @abstractmethod
    def update_source_code_submitted(
        self, team_id: uuid.UUID, challenge_id: uuid.UUID, submitted: bool = True
    ) -> None: ...



class IStorageRepository(ABC):
    @abstractmethod
    def upload(self, key: str, data: bytes, content_type: str = "text/csv") -> str:
        """Upload file lên S3/MinIO, trả về key (object path)."""
        ...

    @abstractmethod
    def download(self, key: str) -> bytes: ...

    @abstractmethod
    def delete(self, key: str) -> None: ...

    @abstractmethod
    def get_presigned_url(self, key: str, expires_in: int = 3600, filename: str | None = None) -> str:
        """
        Tạo presigned URL cho phép Frontend download trực tiếp (không qua API).
        URL trả về phải dùng public endpoint (có thể truy cập từ browser),
        không phải internal Docker hostname.
        """
        ...


class ISolutionRepository(ABC):
    @abstractmethod
    def save(self, solution: SolutionEntity) -> SolutionEntity: ...

    @abstractmethod
    def list_by_challenge(self, challenge_id: uuid.UUID) -> list[SolutionEntity]: ...

    @abstractmethod
    def upvote(self, solution_id: uuid.UUID, user_id: uuid.UUID) -> SolutionEntity | None:
        """
        Upvote solution — chống double-vote qua UNIQUE constraint DB.
        Trả về entity đã cập nhật, None nếu không tồn tại.
        Raises ValueError nếu user đã upvote rồi.
        """
        ...

    @abstractmethod
    def list_by_user(self, user_id: uuid.UUID) -> list[dict]:
        """Lấy danh sách solutions của user kèm challenge_title (JOIN)."""
        ...

class ITagRepository(ABC):
    @abstractmethod
    def get_by_id(self, tag_id: uuid.UUID) -> TagEntity | None: ...

    @abstractmethod
    def get_by_name(self, name: str) -> TagEntity | None: ...

    @abstractmethod
    def get_by_ids(self, tag_ids: list[uuid.UUID]) -> list[TagEntity]: ...

    @abstractmethod
    def save(self, tag: TagEntity) -> TagEntity: ...

    @abstractmethod
    def update(self, tag: TagEntity) -> TagEntity: ...

    @abstractmethod
    def delete(self, tag_id: uuid.UUID) -> None: ...

    @abstractmethod
    def list_all(self) -> list[TagEntity]: ...

