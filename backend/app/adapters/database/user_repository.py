"""
User Repository — Adapter/Database layer.
Implements IUserRepository — CRUD + Profile operations.
Issue #30: Thêm update_profile, update_avatar, get_profile_stats.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.adapters.database.models import (
    LeaderboardModel,
    SolutionModel,
    SubmissionModel,
    TeamMemberModel,
    TeamModel,
    UserModel,
)
from app.application.interfaces.repositories import IUserRepository
from app.domain.entities.entities import UserEntity, UserRole

logger = logging.getLogger(__name__)

_SENTINEL = object()  # Sentinel để phân biệt "không truyền" vs "truyền None"


class UserRepository(IUserRepository):
    def __init__(self, session: Session):
        self._session = session

    def _to_entity(self, model: UserModel) -> UserEntity:
        return UserEntity(
            id=model.id,
            email=model.email,
            student_id=model.student_id,
            full_name=model.full_name,
            role=UserRole(model.role.value if hasattr(model.role, "value") else model.role),
            password_hash=model.password_hash,
            created_at=model.created_at,
            updated_at=model.updated_at,
            deleted_at=model.deleted_at,
            # Profile fields (Issue #30)
            github_url=model.github_url,
            linkedin_url=model.linkedin_url,
            avatar_url=model.avatar_url,
        )

    def _to_model(self, entity: UserEntity) -> UserModel:
        return UserModel(
            id=entity.id,
            email=entity.email,
            student_id=entity.student_id,
            full_name=entity.full_name,
            role=entity.role,
            password_hash=entity.password_hash,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            deleted_at=entity.deleted_at,
            github_url=entity.github_url,
            linkedin_url=entity.linkedin_url,
            avatar_url=entity.avatar_url,
        )

    def get_by_id(self, user_id: uuid.UUID) -> Optional[UserEntity]:
        stmt = select(UserModel).where(
            UserModel.id == user_id, UserModel.deleted_at.is_(None)
        )
        result = self._session.execute(stmt).scalar_one_or_none()
        return self._to_entity(result) if result else None

    def get_by_email(self, email: str) -> Optional[UserEntity]:
        stmt = select(UserModel).where(
            UserModel.email == email, UserModel.deleted_at.is_(None)
        )
        result = self._session.execute(stmt).scalar_one_or_none()
        return self._to_entity(result) if result else None

    def save(self, user: UserEntity) -> UserEntity:
        model = self._to_model(user)
        merged = self._session.merge(model)
        self._session.commit()
        return self._to_entity(merged)

    def list_all(self, page: int, size: int, query: str = "") -> tuple[list[UserEntity], int]:
        stmt = select(UserModel).where(UserModel.deleted_at.is_(None))
        if query:
            stmt = stmt.where(
                (UserModel.email.ilike(f"%{query}%"))
                | (UserModel.full_name.ilike(f"%{query}%"))
                | (UserModel.student_id.ilike(f"%{query}%"))
            )
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self._session.execute(count_stmt).scalar() or 0
        stmt = stmt.order_by(UserModel.created_at.desc()).offset((page - 1) * size).limit(size)
        models = self._session.execute(stmt).scalars().all()
        return [self._to_entity(m) for m in models], total

    def soft_delete(self, user_id: uuid.UUID) -> None:
        stmt = (
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(deleted_at=datetime.now(tz=timezone.utc))
        )
        self._session.execute(stmt)
        self._session.commit()

    def update_status(self, user_id: uuid.UUID, is_active: bool) -> bool:
        """Kích hoạt / vô hiệu hóa tài khoản (Admin feature)."""
        stmt = select(UserModel).where(UserModel.id == user_id)
        user = self._session.execute(stmt).scalar_one_or_none()
        if not user:
            return False
        if is_active:
            user.deleted_at = None
        else:
            if not user.deleted_at:
                user.deleted_at = datetime.now(tz=timezone.utc)
        self._session.add(user)
        self._session.commit()
        return True

    # ==========================================
    # Profile methods (Issue #30)
    # ==========================================

    def update_profile(
        self,
        user_id: uuid.UUID,
        github_url: str | None,
        linkedin_url: str | None,
        avatar_url: str | None = _SENTINEL,  # type: ignore[assignment]
    ) -> UserEntity | None:
        """
        Atomic profile update — chỉ cập nhật các trường được truyền vào.
        avatar_url dùng sentinel pattern để phân biệt "không truyền" vs "xóa URL".
        """
        values: dict = {
            "github_url": github_url,
            "linkedin_url": linkedin_url,
            "updated_at": datetime.now(tz=timezone.utc),
        }
        if avatar_url is not _SENTINEL:
            values["avatar_url"] = avatar_url

        stmt = (
            update(UserModel)
            .where(UserModel.id == user_id, UserModel.deleted_at.is_(None))
            .values(**values)
            .returning(UserModel)
        )
        result = self._session.execute(stmt).scalar_one_or_none()
        if not result:
            return None
        self._session.flush()
        return self._to_entity(result)

    def update_avatar(self, user_id: uuid.UUID, avatar_s3_key: str) -> UserEntity | None:
        """Atomic update chỉ trường avatar_url — dùng sau khi upload thành công."""
        stmt = (
            update(UserModel)
            .where(UserModel.id == user_id, UserModel.deleted_at.is_(None))
            .values(avatar_url=avatar_s3_key, updated_at=datetime.now(tz=timezone.utc))
            .returning(UserModel)
        )
        result = self._session.execute(stmt).scalar_one_or_none()
        if not result:
            return None
        self._session.flush()
        logger.info("Avatar updated for user=%s key=%s", user_id, avatar_s3_key)
        return self._to_entity(result)

    def get_profile_stats(self, user_id: uuid.UUID) -> dict:
        """
        Thống kê profile tổng hợp.
        Dùng 3 COUNT query — đơn giản, dễ đánh index.
        """
        # 1. Tổng bài nộp (submitted_by = user_id)
        total_submissions: int = self._session.execute(
            select(func.count()).select_from(SubmissionModel).where(
                SubmissionModel.submitted_by == user_id
            )
        ).scalar() or 0

        # 2. Tổng giải pháp đã đăng
        total_solutions: int = self._session.execute(
            select(func.count()).select_from(SolutionModel).where(
                SolutionModel.user_id == user_id
            )
        ).scalar() or 0

        # 3. Best rank: tìm qua team membership → leaderboard
        team_ids_sub = (
            select(TeamMemberModel.team_id)
            .join(TeamModel, TeamModel.id == TeamMemberModel.team_id)
            .where(
                TeamMemberModel.user_id == user_id,
                TeamModel.deleted_at.is_(None),
            )
            .subquery()
        )
        best_rank_row = self._session.execute(
            select(func.min(LeaderboardModel.rank)).where(
                LeaderboardModel.team_id.in_(select(team_ids_sub))
            )
        ).scalar()
        best_rank: int | None = int(best_rank_row) if best_rank_row is not None else None

        logger.debug(
            "Profile stats user=%s submissions=%d solutions=%d best_rank=%s",
            user_id, total_submissions, total_solutions, best_rank,
        )
        return {
            "total_submissions": total_submissions,
            "total_solutions": total_solutions,
            "best_rank": best_rank,
        }


# Alias để tương thích ngược với admin_router.py (dùng SQLUserRepository)
SQLUserRepository = UserRepository
