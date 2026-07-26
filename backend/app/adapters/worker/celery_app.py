"""
Celery Application — Background Worker config.
Worker được mount từ app/adapters/worker/ để chấm điểm bất đồng bộ.
"""
import logging

from celery import Celery

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

celery_app = Celery(
    "ictu_ai_judge",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.adapters.worker.scoring_tasks",  # Tasks chấm điểm
        "app.adapters.worker.cleanup_tasks",  # Tasks dọn rác & fix treo
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,
    # Retry policy khi broker mất kết nối
    broker_connection_retry_on_startup=True,
    # Thời gian timeout tối đa cho 1 task scoring
    task_soft_time_limit=settings.WORKER_TIMEOUT_SECONDS,
    task_time_limit=settings.WORKER_TIMEOUT_SECONDS + 30,
    # Beat schedule cho Cronjob dọn rác (UC15)
    beat_schedule={
        "cleanup-stale-submissions": {
            "task": "app.adapters.worker.cleanup_tasks.cleanup_stale_submissions",
            "schedule": 300.0,  # Chạy mỗi 5 phút
        },
    },
)

logger.info(
    "Celery app initialized — broker=%s",
    settings.CELERY_BROKER_URL,
)
