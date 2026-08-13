"""
Domain Entities — ICTU AI JUDGE
Pure Python dataclasses. KHÔNG import FastAPI hay SQLAlchemy.
Đây là lõi nghiệp vụ, framework-agnostic.
"""
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum


# ==========================================
# ENUMS
# ==========================================

class UserRole(str, Enum):
    STUDENT = "STUDENT"
    ADMIN = "ADMIN"


class ChallengeType(str, Enum):
    PUBLIC = "PUBLIC"
    COMPETITION = "COMPETITION"


class ContestStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class ChallengeStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class MetricDirection(str, Enum):
    HIGHER_IS_BETTER = "HIGHER_IS_BETTER"
    LOWER_IS_BETTER = "LOWER_IS_BETTER"


class SubmissionStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class InviteStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"


# ==========================================
# ENTITIES
# ==========================================

@dataclass
class UserEntity:
    id: uuid.UUID
    email: str
    student_id: str
    full_name: str
    role: UserRole
    password_hash: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
    # Profile fields (Issue #30)
    github_url: str | None = None
    linkedin_url: str | None = None
    avatar_url: str | None = None   # Lưu S3 key — URL generate on-the-fly

    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    def is_active(self) -> bool:
        return self.deleted_at is None


@dataclass
class PasswordResetEntity:
    id: uuid.UUID
    user_id: uuid.UUID
    token: str
    expires_at: datetime
    used: bool


@dataclass
class TagEntity:
    id: uuid.UUID
    name: str
    color_hex: str
    created_at: datetime


@dataclass
class ContestEntity:
    """Contest domain entity. Tat ca datetime fields PHAI la timezone-aware (UTC)."""
    id: uuid.UUID
    title: str
    description: str
    status: ContestStatus
    start_time: datetime  # Must be timezone-aware
    end_time: datetime | None  # Must be timezone-aware if set
    created_by: uuid.UUID
    created_at: datetime  # Must be timezone-aware
    updated_at: datetime | None = None
    deleted_at: datetime | None = None

    def __post_init__(self) -> None:
        """Ensure datetime fields la timezone-aware de tranh TypeError khi compare."""
        def _ensure_tz(dt: datetime | None) -> datetime | None:
            if dt is not None and dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt
        self.start_time = _ensure_tz(self.start_time)  # type: ignore[assignment]
        self.end_time = _ensure_tz(self.end_time)
        self.created_at = _ensure_tz(self.created_at)  # type: ignore[assignment]
        self.deleted_at = _ensure_tz(self.deleted_at)


@dataclass
class ChallengeEntity:
    id: uuid.UUID
    title: str
    description: str
    type: ChallengeType
    status: ChallengeStatus
    start_time: datetime
    end_time: datetime | None
    rate_limit_minutes: int
    max_team_size: int
    max_file_size_mb: int
    metric_name: str
    metric_direction: MetricDirection
    created_by: uuid.UUID
    created_at: datetime
    # Thuộc về một Cuộc thi (Contest) nếu có (Issue #123). Dùng để gom nhóm challenges theo kỳ thi.
    contest_id: uuid.UUID | None = None
    dataset_url: str = ""
    ground_truth_url: str = ""
    custom_metric_url: str = ""
    team_lock_deadline: datetime | None = None
    deleted_at: datetime | None = None
    # Dùng cho versioning hoặc chia stage trong Challenge (Self-referential FK - PR #136).
    parent_id: uuid.UUID | None = None
    # [SANDBOX] Môi trường chấm bài và GPU routing (Issue dynamic-sandbox)
    environment_image: str = "ictu-ai-judge-sandbox:latest"
    require_gpu: bool = False
    tags: list[TagEntity] = field(default_factory=list)

    def is_accepting_submissions(self, now: datetime) -> bool:
        """
        Nghiệp vụ: Kiểm tra cửa sổ thời gian nhận bài.
        Chỉ nhận khi PUBLISHED và trong khoảng start → end.
        """
        return (
            self.status == ChallengeStatus.PUBLISHED
            and self.start_time <= now
            and (self.end_time is None or now <= self.end_time)
            and self.deleted_at is None
        )

    def is_team_locked(self, now: datetime) -> bool:
        """Nghiệp vụ: Kiểm tra hạn chốt đội."""
        if self.team_lock_deadline is None:
            return False
        return now >= self.team_lock_deadline


@dataclass
class TeamEntity:
    id: uuid.UUID
    name: str
    challenge_id: uuid.UUID
    leader_id: uuid.UUID
    created_at: datetime
    deleted_at: datetime | None = None
    member_ids: list[uuid.UUID] = field(default_factory=list)

    def has_member(self, user_id: uuid.UUID) -> bool:
        return user_id in self.member_ids

    def is_full(self, max_size: int) -> bool:
        return len(self.member_ids) >= max_size


@dataclass
class TeamInviteEntity:
    id: uuid.UUID
    team_id: uuid.UUID
    inviter_id: uuid.UUID
    invitee_email: str
    token: str
    status: InviteStatus
    expires_at: datetime
    created_at: datetime

    def is_expired(self, now: datetime) -> bool:
        return now >= self.expires_at

    def is_valid(self, now: datetime) -> bool:
        return self.status == InviteStatus.PENDING and not self.is_expired(now)


@dataclass
class SubmissionEntity:
    id: uuid.UUID
    challenge_id: uuid.UUID
    team_id: uuid.UUID
    submitted_by: uuid.UUID
    file_md5_hash: str
    file_size_bytes: int
    status: SubmissionStatus
    submitted_at: datetime
    file_url: str | None = None
    public_score: float | None = None
    private_score: float | None = None
    source_code_url: str | None = None
    is_selected_for_private: bool = False
    execution_time_ms: int | None = None
    error_message: str | None = None


@dataclass
class LeaderboardEntryEntity:
    id: uuid.UUID
    challenge_id: uuid.UUID
    team_id: uuid.UUID
    best_public_score: float
    last_submission_time: datetime
    rank: int = 0
    entries: int = 0
    updated_at: datetime | None = None
    best_private_score: float | None = None
    best_public_submission_id: uuid.UUID | None = None
    best_private_submission_id: uuid.UUID | None = None
    is_source_code_submitted: bool = False


@dataclass
class SolutionEntity:
    id: uuid.UUID
    challenge_id: uuid.UUID
    user_id: uuid.UUID
    title: str
    content: str
    notebook_url: str
    upvotes: int
    created_at: datetime

