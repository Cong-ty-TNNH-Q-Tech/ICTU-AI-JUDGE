"""
Scoring Task — Celery Worker chấm điểm qua Docker Sandbox.
[SECURITY] Không bao giờ import metric.py trực tiếp — luôn dùng Docker Container.
"""
import logging
import time
import uuid
from datetime import datetime, timezone

import docker
from celery import Task

from app.adapters.worker.celery_app import celery_app
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.domain.entities.entities import SubmissionStatus

logger = logging.getLogger(__name__)
settings = get_settings()


class ScoringTask(Task):
    """Base Task với error handling chuẩn — tự động cập nhật status FAILED."""

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        submission_id = kwargs.get("submission_id") or (args[0] if args else None)
        if submission_id:
            _mark_submission_failed(
                submission_id=uuid.UUID(submission_id),
                error_message=f"Worker error: {exc}",
            )
        logger.error("Scoring task %s FAILED: %s", task_id, exc, exc_info=True)


@celery_app.task(
    bind=True,
    base=ScoringTask,
    name="app.adapters.worker.scoring_tasks.score_submission",
    max_retries=1,
    acks_late=True,
)
def score_submission(self, submission_id: str) -> dict:
    """
    Chấm điểm 1 bài nộp qua Docker Sandbox.

    Pipeline:
    1. Load Submission + Challenge từ DB
    2. Download Ground Truth + file CSV từ S3
    3. Spin up Docker Container (isolated, capped RAM/CPU)
    4. Truyền 2 file vào Container, đọc score từ stdout
    5. UPDATE Leaderboard với Pessimistic Locking
    6. Cập nhật status = SUCCESS
    """
    from app.adapters.database.submission_repository import SQLSubmissionRepository
    from app.adapters.database.challenge_repository import SQLChallengeRepository
    from app.adapters.database.leaderboard_repository import SQLLeaderboardRepository
    from app.adapters.storage.s3_repository import S3StorageRepository

    sub_uuid = uuid.UUID(submission_id)
    start_ms = int(time.monotonic() * 1000)

    with SessionLocal() as db:
        sub_repo = SQLSubmissionRepository(db)
        challenge_repo = SQLChallengeRepository(db)
        leaderboard_repo = SQLLeaderboardRepository(db)
        storage = S3StorageRepository()

        # 1. Load entities
        submission = sub_repo.get_by_id(sub_uuid)
        if not submission:
            logger.error("Submission %s not found in DB — possibly deleted", submission_id)
            return {"status": "skipped"}

        challenge = challenge_repo.get_by_id(submission.challenge_id)
        if not challenge:
            logger.error("Challenge %s not found", submission.challenge_id)
            _mark_submission_failed(sub_uuid, "Challenge không còn tồn tại.", sub_repo=sub_repo)
            return {"status": "error"}

        # Mark PROCESSING
        sub_repo.update_status(sub_uuid, SubmissionStatus.PROCESSING)

        try:
            # 2. Download files từ S3
            submission_csv = storage.download(submission.file_url)
            ground_truth_csv = storage.download(challenge.ground_truth_url)

            # 3. Gọi Docker Sandbox
            score = _run_sandbox(
                submission_csv=submission_csv,
                ground_truth_csv=ground_truth_csv,
                metric_script=storage.download(challenge.custom_metric_url) if challenge.custom_metric_url else None,
                metric_name=challenge.metric_name,
            )

            elapsed_ms = int(time.monotonic() * 1000) - start_ms

            # 4. Update submission score
            sub_repo.update_status(
                sub_uuid,
                SubmissionStatus.SUCCESS,
                public_score=score,
                execution_time_ms=elapsed_ms,
            )

            # 5. Upsert Leaderboard với Pessimistic Locking
            from app.domain.entities.entities import LeaderboardEntryEntity
            existing = leaderboard_repo.get_by_team_and_challenge(
                submission.team_id, submission.challenge_id
            )
            is_better = _is_better_score(
                new_score=score,
                current_best=existing.best_public_score if existing else None,
                direction=challenge.metric_direction,
            )
            if is_better or existing is None:
                entry = LeaderboardEntryEntity(
                    id=existing.id if existing else uuid.uuid4(),
                    challenge_id=submission.challenge_id,
                    team_id=submission.team_id,
                    best_public_score=score,
                    best_private_score=existing.best_private_score if existing else None,
                    best_public_submission_id=sub_uuid,
                    best_private_submission_id=existing.best_private_submission_id if existing else None,
                    last_submission_time=submission.submitted_at,
                    rank=0,
                    updated_at=datetime.now(tz=timezone.utc),
                )
                leaderboard_repo.upsert_with_lock(entry)


            # Commit the transaction explicitly if using a standalone session
            db.commit()

            logger.info(
                "Scored submission=%s score=%.6f elapsed_ms=%d",
                submission_id, score, elapsed_ms
            )
            return {"submission_id": submission_id, "score": score}

        except Exception as exc:
            logger.exception("Scoring failed for submission %s", submission_id)
            _mark_submission_failed(sub_uuid, str(exc), sub_repo=sub_repo)
            raise


def _run_sandbox(
    submission_csv: bytes,
    ground_truth_csv: bytes,
    metric_script: bytes | None,
    metric_name: str,
) -> float:
    """
    [SECURITY] Spin up Docker Container 1 lần, truyền file vào, đọc stdout.
    Container bị giới hạn RAM/CPU và chặn network.
    """
    import tempfile
    import os

    client = docker.from_env()

    with tempfile.TemporaryDirectory() as tmpdir:
        sub_path = os.path.join(tmpdir, "submission.csv")
        gt_path = os.path.join(tmpdir, "ground_truth.csv")
        script_path = os.path.join(tmpdir, "metric.py")

        with open(sub_path, "wb") as f:
            f.write(submission_csv)
        with open(gt_path, "wb") as f:
            f.write(ground_truth_csv)

        if metric_script:
            with open(script_path, "wb") as f:
                f.write(metric_script)
            cmd = "python /sandbox/metric.py /sandbox/ground_truth.csv /sandbox/submission.csv"
        else:
            # Built-in metrics
            cmd = (
                f"python -c \""
                f"import pandas as pd; "
                f"gt=pd.read_csv('/sandbox/ground_truth.csv'); "
                f"sub=pd.read_csv('/sandbox/submission.csv'); "
                f"from sklearn.metrics import accuracy_score; "
                f"print(accuracy_score(gt['label'], sub['label']))\""
            )

        container = client.containers.run(
            image="python:3.12-slim",
            command=f"bash -c '{cmd}'",
            volumes={tmpdir: {"bind": "/sandbox", "mode": "ro"}},
            mem_limit=settings.SANDBOX_MEMORY_LIMIT,
            cpu_period=settings.SANDBOX_CPU_PERIOD,
            cpu_quota=settings.SANDBOX_CPU_QUOTA,
            network_disabled=True,          # [SECURITY] Chặn network
            remove=True,                    # Tự hủy sau khi chạy xong
            detach=False,
            stdout=True,
            stderr=False,
        )

        output = container.decode("utf-8").strip()
        return float(output)


def _is_better_score(
    new_score: float,
    current_best: float | None,
    direction: str,
) -> bool:
    if current_best is None:
        return True
    from app.domain.entities.entities import MetricDirection
    if direction == MetricDirection.HIGHER_IS_BETTER:
        return new_score > current_best
    return new_score < current_best


def _mark_submission_failed(
    submission_id: uuid.UUID,
    error_message: str,
    sub_repo=None,
) -> None:
    """Helper — cập nhật status FAILED khi Worker gặp lỗi."""
    try:
        if sub_repo:
            sub_repo.update_status(
                submission_id,
                SubmissionStatus.FAILED,
                error_message=error_message,
            )
        else:
            with SessionLocal() as db:
                from app.adapters.database.submission_repository import SQLSubmissionRepository
                repo = SQLSubmissionRepository(db)
                repo.update_status(submission_id, SubmissionStatus.FAILED, error_message=error_message)
    except Exception as e:
        logger.error("Failed to mark submission %s as FAILED: %s", submission_id, e)
