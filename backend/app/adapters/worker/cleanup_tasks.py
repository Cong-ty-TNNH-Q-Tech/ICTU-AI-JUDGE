"""
Cleanup Task — Cronjob UC15: Fix Worker Treo & Dọn rác.
Chạy theo schedule trong celery_app.conf.beat_schedule.
"""
import logging
import uuid
from datetime import datetime, timedelta, timezone

from app.adapters.worker.celery_app import celery_app
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.domain.entities.entities import SubmissionStatus

logger = logging.getLogger(__name__)
settings = get_settings()


@celery_app.task(name="app.adapters.worker.cleanup_tasks.cleanup_stale_submissions")
def cleanup_stale_submissions() -> dict:
    """
    UC15: Quét các Submission kẹt trạng thái PROCESSING quá lâu.
    Chuyển chúng sang FAILED để sinh viên có thể nộp lại.
    """
    from app.adapters.database.submission_repository import SQLSubmissionRepository

    cutoff = datetime.now(tz=timezone.utc) - timedelta(
        seconds=settings.WORKER_TIMEOUT_SECONDS
    )

    with SessionLocal() as db:
        repo = SQLSubmissionRepository(db)
        stale = repo.list_stale_processing(older_than=cutoff)

        if not stale:
            logger.info("Cleanup: no stale submissions found")
            return {"cleaned": 0}

        for sub in stale:
            repo.update_status(
                sub.id,
                SubmissionStatus.FAILED,
                error_message=(
                    f"Worker timeout: Bài nộp bị treo quá {settings.WORKER_TIMEOUT_SECONDS // 60} phút, "
                    "tự động chuyển sang FAILED. Vui lòng nộp lại."
                ),
            )
            logger.warning(
                "Marked stale submission %s as FAILED (submitted_at=%s)",
                sub.id,
                sub.submitted_at,
            )

        logger.info("Cleanup: marked %d stale submissions as FAILED", len(stale))
        return {"cleaned": len(stale)}
