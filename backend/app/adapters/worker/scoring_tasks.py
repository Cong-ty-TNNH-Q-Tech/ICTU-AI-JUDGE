"""
Scoring Task — Celery Worker chấm điểm qua Docker Sandbox.
[SECURITY] Không bao giờ import metric.py trực tiếp — luôn dùng Docker Container.
"""
import io
import logging
import math
import tarfile
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

            # 3. Determine resource limits
            env_img = challenge.environment_image
            if "cv" in env_img or "nlp" in env_img:
                memory_limit = "8g"
                time_limit_seconds = 600
            else:
                memory_limit = "1g"
                time_limit_seconds = 120

            # 4. Gọi Docker Sandbox
            score = _run_sandbox(
                submission_csv=submission_csv,
                ground_truth_csv=ground_truth_csv,
                metric_script=storage.download(challenge.custom_metric_url) if challenge.custom_metric_url else None,
                metric_name=challenge.metric_name,
                environment_image=challenge.environment_image,
                memory_limit=memory_limit,
                time_limit_seconds=time_limit_seconds,
                require_gpu=challenge.require_gpu,
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
    environment_image: str,
    memory_limit: str,
    time_limit_seconds: int,
    require_gpu: bool,
) -> float:
    """
    [SECURITY] Spin up Docker Container 1 lần, truyền file vào, đọc stdout.
    Container bị giới hạn RAM/CPU và chặn network.
    Tự động phát hiện zip (magic bytes) → giải nén thành thư mục riêng.
    """
    client = docker.from_env()

    # ---- Phát hiện ZIP mode qua magic bytes ----
    is_gt_zip = ground_truth_csv[:4] == b'PK\x03\x04'
    is_sub_zip = submission_csv[:4] == b'PK\x03\x04'
    is_zip = is_gt_zip or is_sub_zip

    if is_zip:
        tar_stream, cmd = _prepare_sandbox_files_zip(
            submission_data=submission_csv,
            ground_truth_data=ground_truth_csv,
            is_gt_zip=is_gt_zip,
            is_sub_zip=is_sub_zip,
            metric_script=metric_script,
            metric_name=metric_name,
        )
    else:
        # === CSV mode: giữ nguyên logic hiện tại ===
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

                # Wrapper script để gọi hàm calculate_score từ metric.py
                wrapper_script = """
import sys
try:
    sys.path.append('/tmp')
    from metric import calculate_score
    score = calculate_score('/tmp/ground_truth.csv', '/tmp/submission.csv')
    print(score)
except Exception as e:
    print(f"Lỗi khi chạy Custom Metric: {str(e)}")
    sys.exit(1)
""".strip().encode('utf-8')

                wrapper_info = tarfile.TarInfo(name='runner.py')
                wrapper_info.size = len(wrapper_script)
                tar.addfile(wrapper_info, io.BytesIO(wrapper_script))

                cmd = "python /tmp/runner.py"
            else:
                # Strategy Pattern cho Built-in metrics
                built_in_script = f"""
import pandas as pd
import sys
import math
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, recall_score

try:
    gt = pd.read_csv('/tmp/ground_truth.csv')
    sub = pd.read_csv('/tmp/submission.csv')

    if 'Usage' in gt.columns:
        gt = gt.drop(columns=['Usage'])

    if len(gt.columns) == 0:
        print('Không tìm thấy cột mục tiêu trong Ground Truth.')
        sys.exit(1)

    # Cột dự đoán (target) thường là cột cuối cùng sau khi bỏ 'Usage'
    target_col = gt.columns[-1]
    if target_col not in sub.columns:
        print(f'Thiếu cột {{target_col}} trong bài nộp.')
        sys.exit(1)

    if len(gt) != len(sub):
        print(f'Số lượng dòng không khớp. Kì vọng {{len(gt)}} dòng, nhưng nhận được {{len(sub)}} dòng.')
        sys.exit(1)

    y_true = gt[target_col]
    y_pred = sub[target_col]

    metric_name = '{metric_name}'

    if metric_name == 'ACCURACY':
        score = accuracy_score(y_true, y_pred)
    elif metric_name == 'F1_SCORE':
        score = f1_score(y_true, y_pred, average='macro')
    elif metric_name == 'RMSE':
        score = math.sqrt(mean_squared_error(y_true, y_pred))
    elif metric_name == 'RECALL':
        score = recall_score(y_true, y_pred, average='macro', zero_division=0)
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

    timeout = time_limit_seconds
    device_requests = []
    if require_gpu:
        device_requests = [docker.types.DeviceRequest(count=-1, capabilities=[['gpu']])]

    import os
    # Default to a generic host path if not set, but in production this should be in .env
    host_weights_path = os.getenv('HOST_PRETRAINED_WEIGHTS_PATH', '/app/backend/pretrained_weights')
    volumes_config = {
        host_weights_path: {'bind': '/weights', 'mode': 'ro'}
    }

    # 1. Create the container (do not start yet)
    container = client.containers.create(
        image=environment_image,
        command=f"bash -c '{cmd}'",
        mem_limit=memory_limit,
        cpu_period=settings.SANDBOX_CPU_PERIOD,
        cpu_quota=settings.SANDBOX_CPU_QUOTA,
        network_disabled=True,          # [SECURITY] Chặn network
        detach=True,
        device_requests=device_requests,
        volumes=volumes_config,
    )

    try:
        # 2. Inject files via put_archive
        container.put_archive("/tmp", tar_stream)

        # 3. Start container and wait for it to finish
        container.start()
        result = container.wait(timeout=timeout)

        output = container.logs(stdout=True, stderr=False).decode("utf-8").strip()

        if result['StatusCode'] != 0:
            error_logs = container.logs(stdout=False, stderr=True).decode("utf-8").strip()
            raise Exception(f"Sandbox exited with code {result['StatusCode']}: {error_logs or output}")

        score = float(output)
        if math.isnan(score) or math.isinf(score):
            raise ValueError(f"Invalid score value returned by metric script: {output}")

        return score
    except docker.errors.APIError as exc:
        if "Read timed out" in str(exc) or "timed out" in str(exc).lower():
            raise Exception(
                "Sandbox execution timed out. "
                "Metric script may contain an infinite loop or process too large files."
            ) from exc
        raise
    finally:
        # Ensure container is destroyed even on error
        container.remove(force=True)


def _prepare_sandbox_files_zip(
    submission_data: bytes,
    ground_truth_data: bytes,
    is_gt_zip: bool,
    is_sub_zip: bool,
    metric_script: bytes | None,
    metric_name: str,
) -> tuple[io.BytesIO, str]:
    """
    Chuẩn bị tar stream cho Docker Sandbox trong ZIP mode.
    Giải nén zip → thư mục riêng biệt trong container.
    Trả về (tar_stream, cmd).
    """
    import zipfile

    tar_stream = io.BytesIO()
    with tarfile.open(fileobj=tar_stream, mode='w') as tar:
        # --- Ground Truth ---
        if is_gt_zip:
            with zipfile.ZipFile(io.BytesIO(ground_truth_data)) as zf:
                for info in zf.infolist():
                    if info.is_dir():
                        continue
                    # [SECURITY] Path Traversal (double-check)
                    if '..' in info.filename or info.filename.startswith('/'):
                        raise ValueError(f"Unsafe filename in GT zip: {info.filename}")
                    file_data = zf.read(info)
                    tarinfo = tarfile.TarInfo(name=f'ground_truth/{info.filename}')
                    tarinfo.size = len(file_data)
                    tar.addfile(tarinfo, io.BytesIO(file_data))
        else:
            gt_info = tarfile.TarInfo(name='ground_truth/ground_truth.csv')
            gt_info.size = len(ground_truth_data)
            tar.addfile(gt_info, io.BytesIO(ground_truth_data))

        # --- Submission ---
        if is_sub_zip:
            with zipfile.ZipFile(io.BytesIO(submission_data)) as zf:
                for info in zf.infolist():
                    if info.is_dir():
                        continue
                    if '..' in info.filename or info.filename.startswith('/'):
                        raise ValueError(f"Unsafe filename in submission zip: {info.filename}")
                    file_data = zf.read(info)
                    tarinfo = tarfile.TarInfo(name=f'submission/{info.filename}')
                    tarinfo.size = len(file_data)
                    tar.addfile(tarinfo, io.BytesIO(file_data))
        else:
            sub_info = tarfile.TarInfo(name='submission/submission.csv')
            sub_info.size = len(submission_data)
            tar.addfile(sub_info, io.BytesIO(submission_data))

        # --- Metric script ---
        if metric_script:
            script_info = tarfile.TarInfo(name='metric.py')
            script_info.size = len(metric_script)
            tar.addfile(script_info, io.BytesIO(metric_script))

        # --- Wrapper script ---
        wrapper = _generate_zip_wrapper(
            has_custom_metric=metric_script is not None,
            metric_name=metric_name,
        )
        wrapper_bytes = wrapper.encode('utf-8')
        wrapper_info = tarfile.TarInfo(name='runner.py')
        wrapper_info.size = len(wrapper_bytes)
        tar.addfile(wrapper_info, io.BytesIO(wrapper_bytes))

    tar_stream.seek(0)
    return tar_stream, "python /tmp/runner.py"


def _generate_zip_wrapper(has_custom_metric: bool, metric_name: str) -> str:
    """Tạo wrapper script cho ZIP mode (thư mục giải nén)."""
    if has_custom_metric:
        return """
import sys
sys.path.append('/tmp')
from metric import calculate_score
score = calculate_score('/tmp/ground_truth', '/tmp/submission')
print(score)
""".strip()
    else:
        return f"""
import pandas as pd
import sys
import math
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error

gt_csv_path = '/tmp/ground_truth/ground_truth.csv'
sub_csv_path = '/tmp/submission/submission.csv'

gt = pd.read_csv(gt_csv_path)
sub = pd.read_csv(sub_csv_path)

if 'Usage' in gt.columns:
    gt_scoring = gt.drop(columns=['Usage'])
else:
    gt_scoring = gt

label_col = gt_scoring.columns[-1]
if label_col not in sub.columns:
    print(f'Thiếu cột {{label_col}} trong bài nộp.')
    sys.exit(1)

y_true = gt_scoring[label_col]
y_pred = sub[label_col]

metric_name = '{metric_name}'
if metric_name == 'ACCURACY':
    score = accuracy_score(y_true, y_pred)
elif metric_name == 'F1_SCORE':
    score = f1_score(y_true, y_pred, average='macro')
elif metric_name == 'RMSE':
    score = math.sqrt(mean_squared_error(y_true, y_pred))
else:
    print(f'Built-in metric {{metric_name}} không được hỗ trợ.')
    sys.exit(1)

print(score)
""".strip()





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
            sub_repo.db.commit()
        else:
            with SessionLocal() as db:
                from app.adapters.database.submission_repository import SQLSubmissionRepository
                repo = SQLSubmissionRepository(db)
                repo.update_status(submission_id, SubmissionStatus.FAILED, error_message=error_message)
                db.commit()
    except Exception as e:
        logger.error("Failed to mark submission %s as FAILED: %s", submission_id, e)
