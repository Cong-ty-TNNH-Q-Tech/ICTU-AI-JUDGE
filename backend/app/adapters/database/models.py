"""
SQLAlchemy ORM Models — Adapter/Database layer.
Map trực tiếp đến các bảng PostgreSQL theo thiết kế ERD.
"""
import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Double,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID, ENUM as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.domain.entities.entities import (
    ChallengeStatus,
    ChallengeType,
    ContestStatus,
    InviteStatus,
    MetricDirection,
    SubmissionStatus,
    UserRole,
)


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    student_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        Enum(UserRole, name="user_role_enum"), nullable=False, default=UserRole.STUDENT
    )
    # Profile fields (Issue #30)
    github_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)  # S3 key

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    team_memberships: Mapped[list["TeamMemberModel"]] = relationship("TeamMemberModel", back_populates="user")
    submissions_made: Mapped[list["SubmissionModel"]] = relationship("SubmissionModel", back_populates="submitted_by_user")
    password_resets: Mapped[list["PasswordResetModel"]] = relationship("PasswordResetModel", back_populates="user")


class PasswordResetModel(Base):
    __tablename__ = "password_resets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Relationships
    user: Mapped["UserModel"] = relationship("UserModel", back_populates="password_resets")


class ContestModel(Base):
    __tablename__ = "contests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(
        PgEnum(ContestStatus, name="contest_status_enum", create_type=False),
        nullable=False,
        default=ContestStatus.DRAFT,
    )
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    challenges: Mapped[list["ChallengeModel"]] = relationship("ChallengeModel", back_populates="contest")


class ChallengeModel(Base):
    __tablename__ = "challenges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contest_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("contests.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    type: Mapped[str] = mapped_column(
        Enum(ChallengeType, name="challenge_type_enum"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        Enum(ChallengeStatus, name="challenge_status_enum"),
        nullable=False,
        default=ChallengeStatus.DRAFT,
    )
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    team_lock_deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rate_limit_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    max_team_size: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    max_file_size_mb: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False)
    metric_direction: Mapped[str] = mapped_column(
        Enum(MetricDirection, name="metric_direction_enum"), nullable=False
    )
    custom_metric_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    dataset_url: Mapped[str] = mapped_column(String(1000), nullable=False, default="")
    ground_truth_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("challenges.id"), nullable=True, index=True)

    # Relationships
    contest: Mapped["ContestModel | None"] = relationship("ContestModel", back_populates="challenges")
    teams: Mapped[list["TeamModel"]] = relationship("TeamModel", back_populates="challenge")
    submissions: Mapped[list["SubmissionModel"]] = relationship("SubmissionModel", back_populates="challenge")
    leaderboard_entries: Mapped[list["LeaderboardModel"]] = relationship("LeaderboardModel", back_populates="challenge")
    participants: Mapped[list["ChallengeParticipantModel"]] = relationship("ChallengeParticipantModel", back_populates="challenge")
    tags: Mapped[list["TagModel"]] = relationship(
        "TagModel", secondary="challenge_tags", back_populates="challenges"
    )
    children: Mapped[list["ChallengeModel"]] = relationship(
        "ChallengeModel", back_populates="parent"
    )
    parent: Mapped["ChallengeModel | None"] = relationship(
        "ChallengeModel", back_populates="children", remote_side="[ChallengeModel.id]"
    )

class TagModel(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    color_hex: Mapped[str] = mapped_column(String(7), nullable=False, default="#CCCCCC")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    challenges: Mapped[list["ChallengeModel"]] = relationship(
        "ChallengeModel", secondary="challenge_tags", back_populates="tags"
    )


class ChallengeTagModel(Base):
    __tablename__ = "challenge_tags"

    challenge_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("challenges.id", ondelete="CASCADE"), primary_key=True)
    tag_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ChallengeParticipantModel(Base):
    __tablename__ = "challenge_participants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenge_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("challenges.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    is_approved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("challenge_id", "user_id", name="uq_participant_challenge_user"),
    )

    # Relationships
    challenge: Mapped["ChallengeModel"] = relationship("ChallengeModel", back_populates="participants")
    user: Mapped["UserModel"] = relationship("UserModel")


class TeamModel(Base):
    __tablename__ = "teams"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    challenge_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("challenges.id"), nullable=False, index=True)
    leader_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    challenge: Mapped["ChallengeModel"] = relationship("ChallengeModel", back_populates="teams")
    members: Mapped[list["TeamMemberModel"]] = relationship("TeamMemberModel", back_populates="team")
    submissions: Mapped[list["SubmissionModel"]] = relationship("SubmissionModel", back_populates="team")
    leaderboard_entry: Mapped["LeaderboardModel | None"] = relationship("LeaderboardModel", back_populates="team", uselist=False)
    invites: Mapped[list["TeamInviteModel"]] = relationship("TeamInviteModel", back_populates="team")


class TeamMemberModel(Base):
    __tablename__ = "team_members"

    team_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teams.id"), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    team: Mapped["TeamModel"] = relationship("TeamModel", back_populates="members")
    user: Mapped["UserModel"] = relationship("UserModel", back_populates="team_memberships")


class TeamInviteModel(Base):
    __tablename__ = "team_invites"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teams.id"), nullable=False, index=True)
    inviter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    invitee_email: Mapped[str] = mapped_column(String(255), nullable=False)
    token: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(
        Enum(InviteStatus, name="invite_status_enum"),
        nullable=False,
        default=InviteStatus.PENDING,
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    team: Mapped["TeamModel"] = relationship("TeamModel", back_populates="invites")


class SubmissionModel(Base):
    __tablename__ = "submissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenge_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("challenges.id"), nullable=False, index=True)
    team_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teams.id"), nullable=False, index=True)
    submitted_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    file_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    file_md5_hash: Mapped[str] = mapped_column(String(32), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    source_code_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    public_score: Mapped[float | None] = mapped_column(Double, nullable=True)
    private_score: Mapped[float | None] = mapped_column(Double, nullable=True)
    is_selected_for_private: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(
        Enum(SubmissionStatus, name="submission_status_enum"),
        nullable=False,
        default=SubmissionStatus.PENDING,
    )
    execution_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        # Unique per team + challenge để chống spam MD5 duplicate
        UniqueConstraint("challenge_id", "team_id", "file_md5_hash", name="uq_submission_md5"),
        # Index for leaderboard entries subquery performance
        Index("idx_submission_team_challenge", "team_id", "challenge_id"),
    )

    # Relationships
    challenge: Mapped["ChallengeModel"] = relationship("ChallengeModel", back_populates="submissions")
    team: Mapped["TeamModel"] = relationship("TeamModel", back_populates="submissions")
    submitted_by_user: Mapped["UserModel"] = relationship("UserModel", back_populates="submissions_made")


class LeaderboardModel(Base):
    __tablename__ = "leaderboard"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenge_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("challenges.id"), nullable=False, index=True)
    team_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teams.id"), nullable=False)
    best_public_score: Mapped[float] = mapped_column(Double, nullable=False)
    best_private_score: Mapped[float | None] = mapped_column(Double, nullable=True)
    best_public_submission_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("submissions.id"), nullable=True
    )
    best_private_submission_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("submissions.id"), nullable=True
    )
    last_submission_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_source_code_submitted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("challenge_id", "team_id", name="uq_leaderboard_challenge_team"),
    )

    # Relationships
    challenge: Mapped["ChallengeModel"] = relationship("ChallengeModel", back_populates="leaderboard_entries")
    team: Mapped["TeamModel"] = relationship("TeamModel", back_populates="leaderboard_entry")
    best_public_submission: Mapped["SubmissionModel | None"] = relationship(
        "SubmissionModel", foreign_keys=[best_public_submission_id]
    )
    best_private_submission: Mapped["SubmissionModel | None"] = relationship(
        "SubmissionModel", foreign_keys=[best_private_submission_id]
    )


class SolutionModel(Base):
    __tablename__ = "solutions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenge_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("challenges.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    notebook_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    upvotes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    challenge: Mapped["ChallengeModel"] = relationship("ChallengeModel")
    user: Mapped["UserModel"] = relationship("UserModel")
    upvote_records: Mapped[list["SolutionUpvoteModel"]] = relationship("SolutionUpvoteModel", back_populates="solution")


class SolutionUpvoteModel(Base):
    """Bảng trung gian theo dõi user nào đã upvote solution nào — chống double-vote."""
    __tablename__ = "solution_upvotes"

    solution_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("solutions.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    solution: Mapped["SolutionModel"] = relationship("SolutionModel", back_populates="upvote_records")
    user: Mapped["UserModel"] = relationship("UserModel")
