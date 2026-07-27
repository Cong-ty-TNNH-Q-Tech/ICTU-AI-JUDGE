"""
Celery Message Broker Adapter.
"""
import logging

from app.application.interfaces.message_broker import IMessageBroker
from app.adapters.worker.scoring_tasks import score_submission

logger = logging.getLogger(__name__)


class CeleryMessageBroker(IMessageBroker):
    def enqueue_scoring_task(self, submission_id: str) -> None:
        """
        Push submission_id vào Redis Queue để Celery Worker consume.
        """
        try:
            score_submission.delay(submission_id)
            logger.info("Celery task dispatched: submission_id=%s", submission_id)
        except Exception as exc:
            # Nếu push Redis thất bại: log lỗi nhưng KHÔNG rollback DB.
            # Cronjob cleanup (UC15) sẽ phát hiện và retry các PENDING quá hạn.
            logger.error(
                "Failed to enqueue scoring task for submission %s: %s",
                submission_id,
                exc,
            )
