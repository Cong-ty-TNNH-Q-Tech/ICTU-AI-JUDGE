"""
Challenges Router — UC03 (enroll), UC04 (submit), UC09 (CRUD), UC10 (participants).
[OWNER] Thành viên phụ trách: Challenge Module
"""
import logging
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.adapters.database.submission_repository import SQLSubmissionRepository
from app.adapters.database.team_repository import SQLTeamRepository
from app.adapters.storage.s3_repository import S3StorageRepository
from app.application.dtos.submission_dtos import (
    SubmissionListResponseDTO,
    SubmitResponseDTO,
)
from app.application.use_cases.submission_use_case import SubmissionUseCase
from app.application.use_cases.challenge_use_case import ChallengeUseCase
from app.application.use_cases.solution_use_case import SolutionUseCase
from app.application.use_cases.admin_use_case import AdminUseCase
from app.application.use_cases.team_use_case import TeamUseCase
from app.application.dtos.solution_dtos import SolutionListResponseDTO, SolutionResponseDTO
from app.domain.entities.entities import UserEntity
from app.entrypoints.dependencies import (
    get_current_user_id,
    get_current_user,
    get_db,
    get_solution_use_case,
    get_challenge_use_case,
    get_submission_use_case,
    get_admin_use_case,
    get_team_use_case,
    require_admin,
)

logger = logging.getLogger(__name__)
router = APIRouter()



# Existing endpoints (skeleton — chưa implement)
# ==========================================

@router.get("")
async def list_challenges(
    status_filter: str | None = None,
    page: int = 1,
    size: int = 20,
    use_case: ChallengeUseCase = Depends(get_challenge_use_case),
):
    """Danh sách bài thi (phân trang). Public endpoint."""
    return use_case.list_challenges(page=page, size=size, status_filter=status_filter)


@router.post("")
async def create_challenge(db: Session = Depends(get_db)):
    """UC09 — Tạo bài thi mới (Admin only)."""
    # TODO: Validate Admin role từ JWT cookie
    raise NotImplementedError("Challenges router — chưa implement")


@router.get("/{challenge_id}")
async def get_challenge(challenge_id: uuid.UUID, use_case: ChallengeUseCase = Depends(get_challenge_use_case)):
    """Chi tiết bài thi."""
    challenge = use_case.get_challenge(challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge


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
    use_case: TeamUseCase = Depends(get_team_use_case),
    user_id: uuid.UUID = Depends(get_current_user_id)
):
    """UC03 — Ghi danh vào Public Challenge (tự động tạo Team of 1)."""
    result = use_case.auto_create_team_if_not_exists(user_id=user_id, challenge_id=challenge_id)
    
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
    admin_id: uuid.UUID = Depends(require_admin),
    use_case: AdminUseCase = Depends(get_admin_use_case),
):
    """UC10 — Xem Whitelist (Admin only)."""
    return use_case.get_whitelist(challenge_id=challenge_id, page=page, size=size)


@router.post("/{challenge_id}/participants")
async def add_participants(
    challenge_id: uuid.UUID,
    request: dict, # expect {"user_ids": ["uuid"]}
    admin_id: uuid.UUID = Depends(require_admin),
    use_case: AdminUseCase = Depends(get_admin_use_case),
):
    """UC10 — Thêm sinh viên vào Whitelist (Admin only)."""
    from app.application.dtos.admin_dtos import WhitelistAddRequestDTO
    
    dto = WhitelistAddRequestDTO(**request)
    return use_case.add_whitelist(challenge_id=challenge_id, user_ids=dto.user_ids)


# ==========================================
# UC04 — Lịch sử nộp bài
# ==========================================

@router.get("/{challenge_id}/submissions", response_model=SubmissionListResponseDTO)
async def list_submissions(
    challenge_id: uuid.UUID,
    page: int = 1,
    size: int = 20,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: SubmissionUseCase = Depends(get_submission_use_case),
):
    """UC04 — Lịch sử nộp bài của Đội (cần auth)."""
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
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: SubmissionUseCase = Depends(get_submission_use_case),
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


    # Use Case thực hiện toàn bộ pipeline validate + S3 + DB lưu
    result = use_case.submit_prediction(
        challenge_id=challenge_id,
        user_id=user_id,
        file_bytes=file_bytes,
        filename=filename,
        content_type=content_type,
    )

    # Trigger quá trình chấm điểm sau khi use case đã commit
    use_case.trigger_scoring(str(result.submission_id))

    return result


# ==========================================
# UC07 — Bảng xếp hạng
# ==========================================




# ==========================================
# Feature: Kernels / Solutions
# ==========================================

@router.get("/{challenge_id}/solutions", response_model=SolutionListResponseDTO)
async def list_solutions(
    challenge_id: uuid.UUID,
    use_case: SolutionUseCase = Depends(get_solution_use_case),
):
    """Lấy danh sách Solutions của một bài thi."""
    try:
        return use_case.list_solutions(challenge_id)
    except ValueError:
        # Challenge không tồn tại — trả về danh sách rỗng thay vì 404
        return SolutionListResponseDTO(items=[], total=0)


@router.post(
    "/{challenge_id}/solutions",
    response_model=SolutionResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def publish_solution(
    challenge_id: uuid.UUID,
    title: str = Form(...),
    content: str = Form(...),
    file: UploadFile = File(...),
    user: UserEntity = Depends(get_current_user),
    use_case: SolutionUseCase = Depends(get_solution_use_case),
    db: Session = Depends(get_db),
):

    """Chia sẻ file notebook (Upload lên S3/MinIO và tạo bản ghi vào DB)."""
    file_bytes = await file.read()
    filename = file.filename or "solution.ipynb"

    try:
        result = use_case.publish_solution(
            user=user,
            challenge_id=challenge_id,
            title=title,
            content=content,
            file_bytes=file_bytes,
            filename=filename,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    db.commit()
    return result


@router.post(
    "/{challenge_id}/solutions/{solution_id}/upvote",
    response_model=SolutionResponseDTO,
)
async def upvote_solution(
    challenge_id: uuid.UUID,
    solution_id: uuid.UUID,
    user: UserEntity = Depends(get_current_user),
    use_case: SolutionUseCase = Depends(get_solution_use_case),
    db: Session = Depends(get_db),
):
    """Upvote một solution (+1). Yêu cầu đăng nhập. Mỗi user chỉ vote được 1 lần."""
    try:
        result = use_case.upvote_solution(solution_id, user.id)
    except LookupError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solution không tồn tại.")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    db.commit()
    return result
