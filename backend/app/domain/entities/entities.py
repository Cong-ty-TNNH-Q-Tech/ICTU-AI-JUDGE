"""
Domain Entities — ICTU AI JUDGE
Pure Python dataclasses. KHÔNG import FastAPI hay SQLAlchemy.
Đây là lõi nghiệp vụ, framework-agnostic.
"""
import uuid
from dataclasses import dataclass, field
from datetime import datetime
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

    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    def is_active(self) -> bool:
        return self.deleted_at is None


@dataclass
class ChallengeEntity:
    id: uuid.UUID
    title: str
    description: str
    type: ChallengeType
    status: ChallengeStatus
    start_time: datetime
    end_time: datetime
    rate_limit_minutes: int
    max_file_size_mb: int
    metric_name: str
    metric_direction: MetricDirection
    created_by: uuid.UUID
    created_at: datetime
    dataset_url: str = ""
    ground_truth_url: str = ""
    custom_metric_url: str = ""
    team_lock_deadline: datetime | None = None
    deleted_at: datetime | None = None

    def is_accepting_submissions(self, now: datetime) -> bool:
        """
        Nghiệp vụ: Kiểm tra cửa sổ thời gian nhận bài.
        Chỉ nhận khi PUBLISHED và trong khoảng start → end.
        """
        return (
            self.status == ChallengeStatus.PUBLISHED
            and self.start_time <= now <= self.end_time
            and self.deleted_at is None
        )

    def is_metric_locked(self) -> bool:
        """
        Nghiệp vụ UC09-E3: Khóa thay đổi metric khi đã có submission thành công.
        Logic này được kiểm tra ở Use Case layer (truyền has_submissions vào).
        """
        return self.status == ChallengeStatus.PUBLISHED

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
class SubmissionEntity:
    id: uuid.UUID
    challenge_id: uuid.UUID
    team_id: uuid.UUID
    submitted_by: uuid.UUID
    file_url: str
    file_md5_hash: str
    file_size_bytes: int
    status: SubmissionStatus
    submitted_at: datetime
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
    rank: int
    updated_at: datetime
    best_private_score: float | None = None
    best_public_submission_id: uuid.UUID | None = None
    best_private_submission_id: uuid.UUID | None = None


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

