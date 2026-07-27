from app.application.interfaces.message_queue import IMessageQueue
from app.adapters.worker.scoring_tasks import score_submission_task

class CeleryMessageQueue(IMessageQueue):
    def enqueue_scoring_task(self, submission_id: str) -> None:
        """Đẩy task chấm điểm vào Celery."""
        score_submission_task.delay(submission_id)
