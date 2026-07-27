"""
Submission Use Case — UC04 (Submit), UC05 (Select Private), UC06 (Source Code).
[CRITICAL] Thứ tự: validate → S3 upload → LƯU DB TRƯỚC → push Redis SAU.
Đảo ngược thứ tự sẽ gây Race Condition (Worker consume trước khi có record).
"""
import csv
import hashlib
import io
import logging
import uuid
from datetime import datetime, timezone

from app.application.dtos.submission_dtos import (
    SelectForPrivateResponseDTO,
    SourceCodeUploadResponseDTO,
    SubmissionListResponseDTO,
    SubmissionResponseDTO,
    SubmitResponseDTO,
)
from app.application.interfaces.repositories import (
    IChallengeRepository,
    IStorageRepository,
    ISubmissionRepository,
    ITeamRepository,
)
from app.application.interfaces.message_broker import IMessageBroker
from app.domain.entities.entities import SubmissionEntity, SubmissionStatus
from app.domain.exceptions.exceptions import (
    DuplicateSubmissionError,
    FileSizeExceededError,
    NotFoundError,
    PermissionDeniedError,
    RateLimitExceededError,
    SubmissionDeadlinePassedError,
)

logger = logging.getLogger(__name__)


class SubmissionUseCase:
    """
    Điều phối toàn bộ nghiệp vụ liên quan đến Submission.
    UC04: Nộp bài — pipeline đầy đủ Anti-Spam + Rate Limit + S3 + DB + Redis.
    UC05: Chọn bài Private.
    UC06: Nộp Source Code.
    """

    def __init__(
        self,
        submission_repo: ISubmissionRepository,
        challenge_repo: IChallengeRepository,
        team_repo: ITeamRepository,
        storage_repo: IStorageRepository,
        message_broker: IMessageBroker = None, # Make it optional for backward compatibility in tests
    ):
        self.submission_repo = submission_repo
        self.challenge_repo = challenge_repo
        self.team_repo = team_repo
        self.storage_repo = storage_repo
        self.message_broker = message_broker

    # ==========================================
    # UC04 — Nộp bài dự thi
    # ==========================================

    def submit_prediction(
        self,
        challenge_id: uuid.UUID,
        user_id: uuid.UUID,
        file_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> SubmitResponseDTO:
        """
        Pipeline UC04 (theo đúng thứ tự bắt buộc):
        1. Lấy team từ challenge + user
        2. Kiểm tra challenge đang PUBLISHED và trong cửa sổ thời gian
        3. Rate Limit check
        4. MD5 Hash + kiểm tra trùng lặp (Anti-Spam)
        5. File size check
        6. Validate CSV format (header + không rỗng)
        7. Upload S3
        8. [CRITICAL] LƯU DB TRƯỚC (status=PENDING)
        9. [CRITICAL] Push Redis Queue SAU
        """
        now = datetime.now(tz=timezone.utc)

        # ---- Step 1: Lấy team ----
        team = self.team_repo.get_by_challenge_and_user(challenge_id, user_id)
        if not team:
            raise PermissionDeniedError(
                "Bạn chưa tham gia bài thi này. Vui lòng ghi danh trước."
            )

        # ---- Step 2: Kiểm tra challenge ----
        challenge = self.challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise NotFoundError(f"Challenge {challenge_id} không tồn tại.")

        if not challenge.is_accepting_submissions(now):
            raise SubmissionDeadlinePassedError(
                "Bài thi không đang mở nhận bài. "
                "Kiểm tra trạng thái PUBLISHED và thời gian start/end."
            )

        # ---- Step 3: Rate Limit check ----
        last_time = self.submission_repo.get_last_submission_time(team.id, challenge_id)
        if last_time is not None:
            # Đảm bảo cả hai datetime đều có timezone để so sánh
            if last_time.tzinfo is None:
                last_time = last_time.replace(tzinfo=timezone.utc)
            elapsed_seconds = (now - last_time).total_seconds()
            rate_limit_seconds = challenge.rate_limit_minutes * 60
            if elapsed_seconds < rate_limit_seconds:
                wait_seconds = rate_limit_seconds - elapsed_seconds
                wait_minutes = max(1, int(wait_seconds / 60) + 1)
                raise RateLimitExceededError(wait_minutes=wait_minutes)

        # ---- Step 4: MD5 Hash + Anti-Spam ----
        md5_hash = hashlib.md5(file_bytes).hexdigest()
        if self.submission_repo.exists_by_hash(team.id, challenge_id, md5_hash):
            raise DuplicateSubmissionError(
                "File này trùng với kết quả lần nộp trước (Trùng mã Hash MD5), "
                "vui lòng không nộp lại."
            )

        # ---- Step 5: File size check ----
        file_size_bytes = len(file_bytes)
        max_bytes = challenge.max_file_size_mb * 1024 * 1024
        if file_size_bytes > max_bytes:
            raise FileSizeExceededError(max_mb=challenge.max_file_size_mb)

        # ---- Step 6: Validate CSV format ----
        _validate_csv_format(file_bytes, filename)

        # ---- Step 7: Upload S3 ----
        s3_key = _build_s3_key(
            challenge_id=challenge_id,
            team_id=team.id,
            submission_id=uuid.uuid4(),  # tạm dùng để build key; ID thật ở step 8
            filename=filename,
        )
        # Tạo submission_id thực sự để dùng nhất quán
        submission_id = uuid.uuid4()
        s3_key = f"submissions/{challenge_id}/{team.id}/{submission_id}/{filename}"
        self.storage_repo.upload(s3_key, file_bytes, content_type=content_type or "text/csv")
        logger.info("UC04 — S3 upload OK: key=%s", s3_key)

        # ---- Step 8: LƯU DB TRƯỚC (BẮTBUỘC trước push Redis) ----
        entity = SubmissionEntity(
            id=submission_id,
            challenge_id=challenge_id,
            team_id=team.id,
            submitted_by=user_id,
            file_url=s3_key,
            file_md5_hash=md5_hash,
            file_size_bytes=file_size_bytes,
            status=SubmissionStatus.PENDING,
            submitted_at=now,
        )
        saved = self.submission_repo.save(entity)
        logger.info("UC04 — DB save OK: submission_id=%s status=PENDING", saved.id)

        # ---- Step 9: Controller sẽ chịu trách nhiệm Push Redis Queue ----
        # UC chỉ trả về ID. Controller sẽ gọi message_broker.enqueue_scoring_task sau db.commit().
        logger.info("UC04 — DB save OK (awaiting Redis push in controller): submission_id=%s", saved.id)

        return SubmitResponseDTO(
            submission_id=saved.id,
            status=SubmissionStatus.PENDING,
            message="Nộp bài thành công. Kết quả sẽ được cập nhật sau vài giây.",
        )

    def trigger_scoring(self, submission_id: str) -> None:
        """
        Trigger quá trình chấm điểm. Phương thức này phải được gọi
        SAU KHI db.commit() đã thành công ở Controller.
        """
        if self.message_broker:
            self.message_broker.enqueue_scoring_task(submission_id)
        else:
            logger.warning("No message_broker injected, scoring task not enqueued.")

    # ==========================================
    # UC05 — Chọn bài tính điểm Private
    # ==========================================

    def select_for_private(
        self,
        submission_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> SelectForPrivateResponseDTO:
        """
        UC05 — Đánh dấu bài nộp làm bài tính điểm chung cuộc.
        - Chỉ được chọn khi challenge chưa kết thúc.
        - Tự động bỏ chọn submission trước đó của cùng team.
        """
        now = datetime.now(tz=timezone.utc)

        submission = self.submission_repo.get_by_id(submission_id)
        if not submission:
            raise NotFoundError(f"Submission {submission_id} không tồn tại.")

        # Kiểm tra quyền: user phải thuộc team của submission
        team = self.team_repo.get_by_id(submission.team_id)
        if not team or not team.has_member(user_id):
            raise PermissionDeniedError("Bạn không có quyền chỉnh sửa submission này.")

        # Kiểm tra challenge chưa kết thúc
        challenge = self.challenge_repo.get_by_id(submission.challenge_id)
        if not challenge:
            raise NotFoundError(f"Challenge không tồn tại.")

        challenge_end = challenge.end_time
        if challenge_end.tzinfo is None:
            challenge_end = challenge_end.replace(tzinfo=timezone.utc)
        if now > challenge_end:
            raise SubmissionDeadlinePassedError(
                "Chỉ được chọn bài Private trước khi challenge kết thúc."
            )

        # Bỏ chọn submission cũ của team trong challenge
        self.submission_repo.clear_selected_for_private(
            team_id=submission.team_id,
            challenge_id=submission.challenge_id,
        )

        # Chọn submission mới
        self.submission_repo.set_selected_for_private(submission_id, True)
        logger.info(
            "UC05 — Selected for private: submission_id=%s team_id=%s",
            submission_id,
            submission.team_id,
        )

        return SelectForPrivateResponseDTO(
            submission_id=submission_id,
            is_selected_for_private=True,
            message="Đã chọn bài làm bài tính điểm chung cuộc.",
        )

    # ==========================================
    # UC06 — Nộp Source Code
    # ==========================================

    def upload_source_code(
        self,
        submission_id: uuid.UUID,
        user_id: uuid.UUID,
        file_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> SourceCodeUploadResponseDTO:
        """
        UC06 — Upload file ZIP/ipynb làm source code.
        Chỉ cho phép sau khi challenge kết thúc.
        """
        now = datetime.now(tz=timezone.utc)

        submission = self.submission_repo.get_by_id(submission_id)
        if not submission:
            raise NotFoundError(f"Submission {submission_id} không tồn tại.")

        # Kiểm tra quyền
        team = self.team_repo.get_by_id(submission.team_id)
        if not team or not team.has_member(user_id):
            raise PermissionDeniedError("Bạn không có quyền upload source code cho submission này.")

        # Kiểm tra challenge đã kết thúc chưa
        challenge = self.challenge_repo.get_by_id(submission.challenge_id)
        if not challenge:
            raise NotFoundError("Challenge không tồn tại.")

        challenge_end = challenge.end_time
        if challenge_end.tzinfo is None:
            challenge_end = challenge_end.replace(tzinfo=timezone.utc)
        if now < challenge_end:
            raise PermissionDeniedError(
                "Chỉ được nộp Source Code sau khi challenge kết thúc."
            )

        # Validate file extension
        lower_name = filename.lower()
        if not (lower_name.endswith(".zip") or lower_name.endswith(".ipynb")):
            raise ValueError(
                "File source code phải có định dạng .zip hoặc .ipynb."
            )

        # Upload S3
        s3_key = f"source_codes/{submission.challenge_id}/{submission.team_id}/{submission_id}/{filename}"
        self.storage_repo.upload(s3_key, file_bytes, content_type=content_type or "application/octet-stream")
        logger.info("UC06 — Source code S3 upload OK: key=%s", s3_key)

        # Cập nhật DB
        self.submission_repo.update_source_code_url(submission_id, s3_key)
        logger.info("UC06 — DB source_code_url updated: submission_id=%s", submission_id)

        return SourceCodeUploadResponseDTO(
            submission_id=submission_id,
            source_code_url=s3_key,
            message="Upload source code thành công.",
        )

    # ==========================================
    # Lịch sử nộp bài (helper cho router)
    # ==========================================

    def list_team_submissions(
        self,
        challenge_id: uuid.UUID,
        user_id: uuid.UUID,
        page: int,
        size: int,
    ) -> SubmissionListResponseDTO:
        """Lịch sử nộp bài của Team hiện tại trong Challenge."""
        team = self.team_repo.get_by_challenge_and_user(challenge_id, user_id)
        if not team:
            raise PermissionDeniedError("Bạn chưa tham gia bài thi này.")

        entities, total = self.submission_repo.list_by_team(
            team_id=team.id,
            challenge_id=challenge_id,
            page=page,
            size=size,
        )

        data = [
            SubmissionResponseDTO(
                id=e.id,
                challenge_id=e.challenge_id,
                team_id=e.team_id,
                submitted_by=e.submitted_by,
                file_url=e.file_url,
                file_md5_hash=e.file_md5_hash,
                file_size_bytes=e.file_size_bytes,
                status=e.status,
                submitted_at=e.submitted_at,
                public_score=e.public_score,
                private_score=e.private_score,
                source_code_url=e.source_code_url,
                is_selected_for_private=e.is_selected_for_private,
                execution_time_ms=e.execution_time_ms,
                error_message=e.error_message,
            )
            for e in entities
        ]
        return SubmissionListResponseDTO(
            total_count=total,
            page=page,
            size=size,
            data=data,
        )


# ==========================================
# Private helper functions
# ==========================================

def _validate_csv_format(file_bytes: bytes, filename: str) -> None:
    """
    Validate cơ bản định dạng CSV:
    - File không rỗng
    - Có thể parse được bằng csv.reader
    - Có ít nhất 1 header row và 1 data row
    Raises ValueError nếu không hợp lệ.
    [NOTE] Lỗi format sâu hơn (sai cột/dòng so với Ground Truth)
    được Worker phát hiện và set status=FAILED (E2 trong UC04).
    """
    if not file_bytes:
        raise ValueError("File CSV rỗng, vui lòng kiểm tra lại.")

    # Kiểm tra extension
    if not filename.lower().endswith(".csv"):
        raise ValueError("Chỉ chấp nhận file định dạng .csv")

    try:
        text = file_bytes.decode("utf-8", errors="replace")
        reader = csv.reader(io.StringIO(text))
        rows = list(reader)
    except Exception as exc:
        raise ValueError(f"Không thể đọc file CSV: {exc}") from exc

    if len(rows) == 0:
        raise ValueError("File CSV rỗng, không có dòng nào.")

    if len(rows) < 2:
        raise ValueError("File CSV cần có ít nhất 1 dòng header và 1 dòng dữ liệu.")


def _build_s3_key(
    challenge_id: uuid.UUID,
    team_id: uuid.UUID,
    submission_id: uuid.UUID,
    filename: str,
) -> str:
    """Tạo S3 object key theo cấu trúc chuẩn."""
    return f"submissions/{challenge_id}/{team_id}/{submission_id}/{filename}"



