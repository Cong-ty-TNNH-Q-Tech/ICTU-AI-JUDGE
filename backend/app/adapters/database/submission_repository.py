import uuid
from datetime import datetime
from sqlalchemy import select, and_, or_, func, update
from sqlalchemy.orm import Session
from app.application.interfaces.repositories import ISubmissionRepository
from app.domain.entities.entities import SubmissionEntity, SubmissionStatus
from app.adapters.database.models import SubmissionModel, LeaderboardModel

class SQLSubmissionRepository(ISubmissionRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, submission_id: uuid.UUID) -> SubmissionEntity | None:
        raise NotImplementedError

    def save(self, submission: SubmissionEntity) -> SubmissionEntity:
        raise NotImplementedError

    def update_status(
        self,
        submission_id: uuid.UUID,
        status: SubmissionStatus,
        public_score: float | None = None,
        private_score: float | None = None,
        execution_time_ms: int | None = None,
        error_message: str | None = None,
    ) -> None:
        stmt = (
            update(SubmissionModel)
            .where(SubmissionModel.id == submission_id)
            .values(
                status=status.value,
                error_message=error_message,
            )
        )
        self.db.execute(stmt)
        self.db.commit()

    def get_last_submission_time(self, team_id: uuid.UUID, challenge_id: uuid.UUID) -> datetime | None:
        raise NotImplementedError

    def exists_by_hash(self, team_id: uuid.UUID, challenge_id: uuid.UUID, md5_hash: str) -> bool:
        raise NotImplementedError

    def list_by_team(self, team_id: uuid.UUID, challenge_id: uuid.UUID, page: int, size: int) -> tuple[list[SubmissionEntity], int]:
        raise NotImplementedError

    def list_stale_processing(self, older_than: datetime) -> list[SubmissionEntity]:
        stmt = select(SubmissionModel).where(
            SubmissionModel.status == SubmissionStatus.PROCESSING.value,
            SubmissionModel.submitted_at < older_than
        )
        models = self.db.execute(stmt).scalars().all()
        entities = []
        for m in models:
            entities.append(SubmissionEntity(
                id=m.id, challenge_id=m.challenge_id, team_id=m.team_id,
                submitted_by=m.submitted_by, file_url=m.file_url,
                file_md5_hash=m.file_md5_hash, file_size_bytes=m.file_size_bytes,
                status=SubmissionStatus(m.status), submitted_at=m.submitted_at
            ))
        return entities

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
