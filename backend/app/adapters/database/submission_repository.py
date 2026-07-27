"""
Submission Repository Adapter (SQLAlchemy).
Implements ISubmissionRepository — CRUD và queries cho bảng SUBMISSION.
"""
import uuid
from datetime import datetime

from sqlalchemy import select, update, and_, or_, func
from sqlalchemy.orm import Session

from app.adapters.database.models import SubmissionModel, LeaderboardModel
from app.application.interfaces.repositories import ISubmissionRepository
from app.domain.entities.entities import SubmissionEntity, SubmissionStatus


class SQLSubmissionRepository(ISubmissionRepository):
    def __init__(self, db_session: Session):
        self.db = db_session

    # ==========================================
    # Private helpers
    # ==========================================

    @staticmethod
    def _to_entity(model: SubmissionModel) -> SubmissionEntity:
        """Map ORM model → Domain Entity."""
        return SubmissionEntity(
            id=model.id,
            challenge_id=model.challenge_id,
            team_id=model.team_id,
            submitted_by=model.submitted_by,
            file_url=model.file_url,
            file_md5_hash=model.file_md5_hash,
            file_size_bytes=model.file_size_bytes,
            status=model.status,
            submitted_at=model.submitted_at,
            public_score=model.public_score,
            private_score=model.private_score,
            source_code_url=model.source_code_url,
            is_selected_for_private=model.is_selected_for_private,
            execution_time_ms=model.execution_time_ms,
            error_message=model.error_message,
        )

    # ==========================================
    # ISubmissionRepository interface
    # ==========================================

    def get_by_id(self, submission_id: uuid.UUID) -> SubmissionEntity | None:
        model = (
            self.db.execute(
                select(SubmissionModel).where(SubmissionModel.id == submission_id)
            )
            .scalars()
            .first()
        )
        if not model:
            return None
        return self._to_entity(model)

    def save(self, submission: SubmissionEntity) -> SubmissionEntity:
        """
        Insert một Submission mới vào DB.
        Trả về entity đã được persist (có submitted_at từ DB).
        """
        model = SubmissionModel(
            id=submission.id,
            challenge_id=submission.challenge_id,
            team_id=submission.team_id,
            submitted_by=submission.submitted_by,
            file_url=submission.file_url,
            file_md5_hash=submission.file_md5_hash,
            file_size_bytes=submission.file_size_bytes,
            status=submission.status,
            public_score=submission.public_score,
            private_score=submission.private_score,
            source_code_url=submission.source_code_url,
            is_selected_for_private=submission.is_selected_for_private,
            execution_time_ms=submission.execution_time_ms,
            error_message=submission.error_message,
        )
        self.db.add(model)
        self.db.flush()  # flush để lấy submitted_at từ DB server_default
        self.db.refresh(model)
        return self._to_entity(model)



    def get_stale_submissions(self, older_than: datetime) -> list[SubmissionEntity]:
        """
        Lấy danh sách các file nộp thoả mãn: 
        1. Không phải là best_public_submission_id 
        2. Không phải là best_private_submission_id
        3. Không phải là file mới nộp gần đây nhất của team
        4. Đã nộp được hơn 1 ngày
        """
        # CTE to rank submissions by time (1 = newest)
        ranked_subs = (
            select(
                SubmissionModel.id,
                func.row_number().over(
                    partition_by=[SubmissionModel.challenge_id, SubmissionModel.team_id],
                    order_by=SubmissionModel.submitted_at.desc()
                ).label("rn")
            )
            .cte("ranked_subs")
        )

        stmt = (
            select(SubmissionModel)
            .join(LeaderboardModel, 
                  and_(SubmissionModel.challenge_id == LeaderboardModel.challenge_id,
                       SubmissionModel.team_id == LeaderboardModel.team_id),
                  isouter=True  # In case leaderboard entry doesn't exist yet
            )
            .join(ranked_subs, SubmissionModel.id == ranked_subs.c.id)
            .where(
                SubmissionModel.file_url.is_not(None),
                SubmissionModel.submitted_at < older_than,
                ranked_subs.c.rn > 1, # Không phải là file mới nộp gần đây nhất
                or_(
                    LeaderboardModel.id.is_(None), # No leaderboard entry
                    and_(
                        or_(
                            LeaderboardModel.best_public_submission_id.is_(None),
                            SubmissionModel.id != LeaderboardModel.best_public_submission_id
                        ),
                        or_(
                            LeaderboardModel.best_private_submission_id.is_(None),
                            SubmissionModel.id != LeaderboardModel.best_private_submission_id
                        )
                    )
                )
            )
        )
        models = self.db.execute(stmt).scalars().all()
        entities = []
        for m in models:
            entities.append(SubmissionEntity(
                id=m.id, challenge_id=m.challenge_id, team_id=m.team_id,
                submitted_by=m.submitted_by, file_url=m.file_url,
                file_md5_hash=m.file_md5_hash, file_size_bytes=m.file_size_bytes,
                status=SubmissionStatus(m.status), submitted_at=m.submitted_at,
                public_score=m.public_score, private_score=m.private_score,
                source_code_url=m.source_code_url, is_selected_for_private=m.is_selected_for_private,
                execution_time_ms=m.execution_time_ms, error_message=m.error_message
            ))
        return entities

    def nullify_file_urls(self, submission_ids: list[uuid.UUID]) -> None:
        if not submission_ids:
            return
        stmt = (
            update(SubmissionModel)
            .where(SubmissionModel.id.in_(submission_ids))
            .values(file_url=None)
        )
        self.db.execute(stmt)
        self.db.commit()

    def update_status(
        self,
        submission_id: uuid.UUID,
        status: SubmissionStatus,
        public_score: float | None = None,
        private_score: float | None = None,
        execution_time_ms: int | None = None,
        error_message: str | None = None,
    ) -> None:

        """
        Cập nhật status (và các trường tùy chọn) của Submission.
        Được Worker gọi sau khi chấm xong hoặc gặp lỗi.
        """
        values: dict = {"status": status}
        if public_score is not None:
            values["public_score"] = public_score
        if private_score is not None:
            values["private_score"] = private_score
        if execution_time_ms is not None:
            values["execution_time_ms"] = execution_time_ms
        if error_message is not None:
            values["error_message"] = error_message

        self.db.execute(
            update(SubmissionModel)
            .where(SubmissionModel.id == submission_id)
            .values(**values)
        )
        self.db.flush()

    def get_last_submission_time(
        self, team_id: uuid.UUID, challenge_id: uuid.UUID
    ) -> datetime | None:
        """
        Lấy thời gian nộp bài gần nhất của team trong challenge.
        Dùng để kiểm tra Rate Limit.
        Chỉ tính các submission KHÔNG phải FAILED vì lỗi format (E2).
        """
        model = (
            self.db.execute(
                select(SubmissionModel)
                .where(
                    SubmissionModel.team_id == team_id,
                    SubmissionModel.challenge_id == challenge_id,
                    # Không đếm các bài lỗi format vào rate limit
                    SubmissionModel.status != SubmissionStatus.FAILED,
                )
                .order_by(SubmissionModel.submitted_at.desc())
            )
            .scalars()
            .first()
        )
        if not model:
            return None
        return model.submitted_at

    def exists_by_hash(
        self, team_id: uuid.UUID, challenge_id: uuid.UUID, md5_hash: str
    ) -> bool:
        """
        Kiểm tra trùng lặp file theo MD5 Hash trong cùng team + challenge.
        Trả về True nếu đã tồn tại (Anti-Spam MD5).
        """
        result = (
            self.db.execute(
                select(SubmissionModel.id)
                .where(
                    SubmissionModel.team_id == team_id,
                    SubmissionModel.challenge_id == challenge_id,
                    SubmissionModel.file_md5_hash == md5_hash,
                )
                .limit(1)
            )
            .scalars()
            .first()
        )
        return result is not None

    def list_by_team(
        self, team_id: uuid.UUID, challenge_id: uuid.UUID, page: int, size: int
    ) -> tuple[list[SubmissionEntity], int]:
        """Lịch sử nộp bài của Team trong một Challenge (phân trang)."""
        from sqlalchemy import func

        total = (
            self.db.execute(
                select(func.count(SubmissionModel.id)).where(
                    SubmissionModel.team_id == team_id,
                    SubmissionModel.challenge_id == challenge_id,
                )
            )
            .scalar_one()
        )

        models = (
            self.db.execute(
                select(SubmissionModel)
                .where(
                    SubmissionModel.team_id == team_id,
                    SubmissionModel.challenge_id == challenge_id,
                )
                .order_by(SubmissionModel.submitted_at.desc())
                .offset((page - 1) * size)
                .limit(size)
            )
            .scalars()
            .all()
        )

        return [self._to_entity(m) for m in models], total

    def list_all_by_challenge(
        self, challenge_id: uuid.UUID, page: int, size: int
    ) -> tuple[list[SubmissionEntity], int]:
        """UC11 — Lấy tất cả bài nộp trong 1 Challenge cho Admin (phân trang)."""
        from sqlalchemy import func

        total = (
            self.db.execute(
                select(func.count(SubmissionModel.id)).where(
                    SubmissionModel.challenge_id == challenge_id
                )
            )
            .scalar_one()
        )

        models = (
            self.db.execute(
                select(SubmissionModel)
                .where(SubmissionModel.challenge_id == challenge_id)
                .order_by(SubmissionModel.submitted_at.desc())
                .offset((page - 1) * size)
                .limit(size)
            )
            .scalars()
            .all()
        )

        return [self._to_entity(m) for m in models], total


    def list_stale_processing(self, older_than: datetime) -> list[SubmissionEntity]:
        """
        UC15 — Lấy danh sách Submission bị kẹt trạng thái PROCESSING quá lâu.
        Cronjob cleanup_tasks dùng để chuyển sang FAILED.
        """
        models = (
            self.db.execute(
                select(SubmissionModel).where(
                    SubmissionModel.status == SubmissionStatus.PROCESSING,
                    SubmissionModel.submitted_at < older_than,
                )
            )
            .scalars()
            .all()
        )
        return [self._to_entity(m) for m in models]

    def clear_selected_for_private(
        self, team_id: uuid.UUID, challenge_id: uuid.UUID
    ) -> None:
        """
        UC05 — Bỏ chọn tất cả submission trước đó của team trong challenge.
        Gọi trước khi set is_selected_for_private = True cho submission mới.
        """
        self.db.execute(
            update(SubmissionModel)
            .where(
                SubmissionModel.team_id == team_id,
                SubmissionModel.challenge_id == challenge_id,
                SubmissionModel.is_selected_for_private == True,  # noqa: E712
            )
            .values(is_selected_for_private=False)
        )
        self.db.flush()

    def set_selected_for_private(
        self, submission_id: uuid.UUID, value: bool
    ) -> None:
        """UC05 — Set is_selected_for_private cho một submission cụ thể."""
        self.db.execute(
            update(SubmissionModel)
            .where(SubmissionModel.id == submission_id)
            .values(is_selected_for_private=value)
        )
        self.db.flush()

    def update_source_code_url(
        self, submission_id: uuid.UUID, source_code_url: str
    ) -> None:
        """UC06 — Cập nhật đường dẫn source code sau khi upload."""
        self.db.execute(
            update(SubmissionModel)
            .where(SubmissionModel.id == submission_id)
            .values(source_code_url=source_code_url)
        )
        self.db.flush()
