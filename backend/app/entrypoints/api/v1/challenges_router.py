"""
Challenges Router — UC03 (enroll), UC04 (submit), UC09 (CRUD), UC10 (participants).
[OWNER] Thành viên phụ trách: Challenge Module
"""
import logging
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.adapters.database.challenge_repository import SQLChallengeRepository
from app.adapters.database.submission_repository import SQLSubmissionRepository
from app.adapters.database.team_repository import SQLTeamRepository
from app.adapters.storage.s3_repository import S3StorageRepository
from app.application.dtos.submission_dtos import (
    SubmissionListResponseDTO,
    SubmitResponseDTO,
)
from app.application.use_cases.submission_use_case import SubmissionUseCase
from app.entrypoints.dependencies import get_current_user_id, get_db, require_admin

logger = logging.getLogger(__name__)
router = APIRouter()


# ==========================================
# Helper: khởi tạo SubmissionUseCase
# ==========================================

def _get_submission_use_case(db: Session) -> SubmissionUseCase:
    return SubmissionUseCase(
        submission_repo=SQLSubmissionRepository(db),
        challenge_repo=SQLChallengeRepository(db),
        team_repo=SQLTeamRepository(db),
        storage_repo=S3StorageRepository(),
    )


# ==========================================
# Existing endpoints (skeleton — chưa implement)
# ==========================================

@router.get("")
async def list_challenges(
    status_filter: str | None = None,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
):
    """Danh sách bài thi (phân trang). Public endpoint."""
    # TODO: Implement
    raise NotImplementedError("Challenges router — chưa implement")


@router.post("")
async def create_challenge(db: Session = Depends(get_db)):
    """UC09 — Tạo bài thi mới (Admin only)."""
    # TODO: Validate Admin role từ JWT cookie
    raise NotImplementedError("Challenges router — chưa implement")


@router.get("/{challenge_id}")
async def get_challenge(challenge_id: uuid.UUID, db: Session = Depends(get_db)):
    """Chi tiết bài thi."""
    # TODO: Implement
    raise NotImplementedError("Challenges router — chưa implement")


@router.patch("/{challenge_id}")
async def update_challenge(challenge_id: uuid.UUID, db: Session = Depends(get_db)):
    """UC09 — Cập nhật bài thi (Admin only). Bị khóa nếu đã có Submission."""
    # TODO: Implement
    raise NotImplementedError("Challenges router — chưa implement")


@router.delete("/{challenge_id}")
async def delete_challenge(challenge_id: uuid.UUID, db: Session = Depends(get_db)):
    """UC09 — Soft delete bài thi (Admin only)."""
    # TODO: Implement
    raise NotImplementedError("Challenges router — chưa implement")


@router.post("/{challenge_id}/upload-secrets")
async def upload_secrets(
    challenge_id: uuid.UUID,
    ground_truth_csv: UploadFile = File(...),
    metric_script_py: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    """Upload Ground Truth + Custom Metric (Admin only, lưu kín trên S3)."""
    # TODO: Implement
    raise NotImplementedError("Challenges router — chưa implement")


@router.post("/{challenge_id}/enroll", response_model=dict)
async def enroll(
    challenge_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id)
):
    """UC03 — Ghi danh vào Public Challenge (tự động tạo Team of 1)."""
    from app.application.use_cases.team_use_case import TeamUseCase
    from app.adapters.database.user_repository import SQLUserRepository
    from app.adapters.database.team_repository import SQLTeamRepository

    use_case = TeamUseCase(
        team_repo=SQLTeamRepository(db),
        challenge_repo=SQLChallengeRepository(db),
        user_repo=SQLUserRepository(db)
    )
    
    result = use_case.auto_create_team_if_not_exists(user_id=user_id, challenge_id=challenge_id)
    db.commit()
    
    return {
        "detail": "Ghi danh thành công",
        "team_id": result.id,
        "team_name": result.name
    }


@router.get("/{challenge_id}/participants")
async def list_participants(
    challenge_id: uuid.UUID,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
    admin_id: uuid.UUID = Depends(require_admin)
):
    """UC10 — Xem Whitelist (Admin only)."""
    from app.application.use_cases.admin_use_case import AdminUseCase
    from app.adapters.database.user_repository import SQLUserRepository
    
    use_case = AdminUseCase(
        user_repo=SQLUserRepository(db),
        challenge_repo=SQLChallengeRepository(db),
        submission_repo=SQLSubmissionRepository(db),
    )
    return use_case.get_whitelist(challenge_id=challenge_id, page=page, size=size)


@router.post("/{challenge_id}/participants")
async def add_participants(
    challenge_id: uuid.UUID,
    request: dict, # expect {"user_ids": ["uuid"]}
    db: Session = Depends(get_db),
    admin_id: uuid.UUID = Depends(require_admin)
):
    """UC10 — Thêm sinh viên vào Whitelist (Admin only)."""
    from app.application.dtos.admin_dtos import WhitelistAddRequestDTO
    from app.application.use_cases.admin_use_case import AdminUseCase
    from app.adapters.database.user_repository import SQLUserRepository
    
    dto = WhitelistAddRequestDTO(**request)
    use_case = AdminUseCase(
        user_repo=SQLUserRepository(db),
        challenge_repo=SQLChallengeRepository(db),
        submission_repo=SQLSubmissionRepository(db),
    )
    result = use_case.add_whitelist(challenge_id=challenge_id, user_ids=dto.user_ids)
    db.commit()
    return result


# ==========================================
# UC04 — Lịch sử nộp bài
# ==========================================

@router.get("/{challenge_id}/submissions", response_model=SubmissionListResponseDTO)
async def list_submissions(
    challenge_id: uuid.UUID,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    """UC04 — Lịch sử nộp bài của Đội (cần auth)."""
    use_case = _get_submission_use_case(db)
    return use_case.list_team_submissions(
        challenge_id=challenge_id,
        user_id=user_id,
        page=page,
        size=size,
    )


# ==========================================
# UC04 — Nộp bài dự thi (endpoint quan trọng nhất)
# ==========================================

@router.post(
    "/{challenge_id}/submissions",
    response_model=SubmitResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def submit(
    challenge_id: uuid.UUID,
    file: UploadFile = File(..., description="File CSV dự đoán, tối đa max_file_size_mb"),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    """
    UC04 — Nộp bài dự thi.

    Pipeline (theo đúng thứ tự bắt buộc):
    1. JWT Cookie → user_id → team_id
    2. Kiểm tra challenge PUBLISHED + trong cửa sổ start→end
    3. Rate Limit check (HTTP 429 nếu vi phạm)
    4. MD5 Hash + Anti-Spam (HTTP 409 nếu trùng)
    5. File size check (HTTP 413 nếu vượt giới hạn)
    6. Validate CSV format
    7. Upload S3
    8. [CRITICAL] LƯU DB TRƯỚC (status=PENDING)
    9. [CRITICAL] Push Redis Queue SAU khi commit
    10. Trả về HTTP 201 {status: PENDING}
    """
    # Đọc toàn bộ file vào memory để tính MD5 và validate
    file_bytes = await file.read()
    filename = file.filename or "submission.csv"
    content_type = file.content_type or "text/csv"

    use_case = _get_submission_use_case(db)

    # Use Case thực hiện toàn bộ pipeline validate + S3 + DB lưu
    result = use_case.submit_prediction(
        challenge_id=challenge_id,
        user_id=user_id,
        file_bytes=file_bytes,
        filename=filename,
        content_type=content_type,
    )

    # [CRITICAL] Commit DB TRƯỚC khi Celery Worker consume job từ Redis.
    # _enqueue_scoring_task() trong use_case đã được gọi — Worker sẽ
    # tìm record trong DB và sẽ thấy nó vì commit xảy ra trước.
    db.commit()

    return result


# ==========================================
# UC07 — Bảng xếp hạng
# ==========================================

@router.get("/{challenge_id}/leaderboard")
async def get_leaderboard(
    challenge_id: uuid.UUID,
    type: str = "public",
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
):
    """UC07 — Bảng xếp hạng Public/Private (phân trang)."""
    # TODO: Implement
    raise NotImplementedError("Challenges router — chưa implement")

