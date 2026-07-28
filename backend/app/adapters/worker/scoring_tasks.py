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
            entry = LeaderboardEntryEntity(
                id=uuid.uuid4(),
                challenge_id=submission.challenge_id,
                team_id=submission.team_id,
                best_public_score=score,
                best_private_score=None,
                best_public_submission_id=sub_uuid,
                best_private_submission_id=None,
                last_submission_time=submission.submitted_at,
                rank=0,
                updated_at=datetime.now(tz=timezone.utc),
            )
            leaderboard_repo.upsert_with_lock(entry, direction=challenge.metric_direction)

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
    import tarfile
    import io

    client = docker.from_env()

    # Create tar stream in memory
    tar_stream = io.BytesIO()
    with tarfile.open(fileobj=tar_stream, mode='w') as tar:
        # Add submission.csv
        sub_info = tarfile.TarInfo(name='submission.csv')
        sub_info.size = len(submission_csv)
        tar.addfile(sub_info, io.BytesIO(submission_csv))

        # Add ground_truth.csv
        gt_info = tarfile.TarInfo(name='ground_truth.csv')
        gt_info.size = len(ground_truth_csv)
        tar.addfile(gt_info, io.BytesIO(ground_truth_csv))

        if metric_script:
            script_info = tarfile.TarInfo(name='metric.py')
            script_info.size = len(metric_script)
            tar.addfile(script_info, io.BytesIO(metric_script))
            cmd = "python /tmp/metric.py /tmp/ground_truth.csv /tmp/submission.csv"
        else:
            # Strategy Pattern cho Built-in metrics
            built_in_script = f"""
import pandas as pd
import sys
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error

try:
    gt = pd.read_csv('/tmp/ground_truth.csv')
    sub = pd.read_csv('/tmp/submission.csv')

    if 'Usage' in gt.columns:
        gt = gt.drop(columns=['Usage'])
        
    # Xóa cột ID (case-insensitive)
    cols_to_drop = [c for c in gt.columns if c.lower() == 'id']
    target_cols = gt.columns.difference(cols_to_drop)
    
    if len(target_cols) == 0:
        print('Không tìm thấy cột mục tiêu trong Ground Truth.')
        sys.exit(1)
        
    target_col = target_cols[0]
    if target_col not in sub.columns:
        print(f'Thiếu cột {{target_col}} trong bài nộp.')
        sys.exit(1)

    y_true = gt[target_col]
    y_pred = sub[target_col]

    metric_name = '{metric_name}'
    
    if metric_name == 'ACCURACY':
        score = accuracy_score(y_true, y_pred)
    elif metric_name == 'F1_SCORE':
        score = f1_score(y_true, y_pred, average='macro')
    elif metric_name == 'RMSE':
        score = mean_squared_error(y_true, y_pred, squared=False)
    else:
        print(f'Built-in metric {{metric_name}} không được hỗ trợ.')
        sys.exit(1)

    print(score)
except Exception as e:
    print(f"Lỗi khi chấm điểm: {{str(e)}}")
    sys.exit(1)
""".encode('utf-8')
            
            script_info = tarfile.TarInfo(name='built_in_metric.py')
            script_info.size = len(built_in_script)
            tar.addfile(script_info, io.BytesIO(built_in_script))
            cmd = "python /tmp/built_in_metric.py"

    tar_stream.seek(0)

    # 1. Create the container (do not start yet)
    container = client.containers.create(
        image="ictu-ai-judge-sandbox:latest",
        command=f"bash -c '{cmd}'",
        mem_limit=settings.SANDBOX_MEMORY_LIMIT,
        cpu_period=settings.SANDBOX_CPU_PERIOD,
        cpu_quota=settings.SANDBOX_CPU_QUOTA,
        network_disabled=True,          # [SECURITY] Chặn network
        detach=True,
    )

    try:
        # 2. Inject files via put_archive (Docker automatically creates /tmp if it doesn't exist)
        container.put_archive("/tmp", tar_stream)

        # 3. Start container and wait for it to finish
        container.start()
        result = container.wait(timeout=30)
        
        output = container.logs(stdout=True, stderr=False).decode("utf-8").strip()
        
        if result['StatusCode'] != 0:
            error_logs = container.logs(stdout=False, stderr=True).decode("utf-8").strip()
            raise Exception(f"Sandbox exited with code {result['StatusCode']}: {error_logs or output}")

        return float(output)
    finally:
        # Ensure container is destroyed even on error
        container.remove(force=True)





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
