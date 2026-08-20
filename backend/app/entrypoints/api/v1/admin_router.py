"""
Admin Router — UC12 (Quản lý sinh viên), UC13 (Thảo luận).
[OWNER] Thành viên phụ trách: Admin Module
"""
import logging
import time
import uuid

from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from fastapi.responses import Response

from app.application.dtos.admin_dtos import UserListResponseDTO, UserStatusUpdateRequestDTO, UserRoleUpdateRequestDTO
from app.application.dtos.submission_dtos import SubmissionListResponseDTO
from app.application.use_cases.admin_use_case import AdminUseCase
from app.entrypoints.dependencies import require_admin, get_admin_use_case

logger = logging.getLogger(__name__)
router = APIRouter(dependencies=[Depends(require_admin)])


@router.post("/challenges/test-metric")
async def test_metric(
    ground_truth: UploadFile = File(...),
    submission: UploadFile = File(...),
    metric_script: UploadFile = File(None),
    metric_name: str = Form(...),
    use_case: AdminUseCase = Depends(get_admin_use_case),
):
    """Admin — Chạy thử metric script trong Sandbox."""
    gt_bytes = await ground_truth.read()
    sub_bytes = await submission.read()
    script_bytes = await metric_script.read() if metric_script else None
    
    score = use_case.test_metric(
        ground_truth=gt_bytes,
        submission=sub_bytes,
        metric_script=script_bytes,
        metric_name=metric_name,
    )
    return {"score": score}


@router.get("/users", response_model=UserListResponseDTO)
async def list_users(
    q: str = "",
    page: int = 1,
    size: int = 20,
    use_case: AdminUseCase = Depends(get_admin_use_case),
):
    """UC12 — Danh sách sinh viên (Admin only). Tìm kiếm theo email/họ tên."""
    return use_case.list_users(q=q, page=page, size=size)


@router.patch("/users/{user_id}")
async def update_user_status(
    user_id: uuid.UUID,
    request: UserStatusUpdateRequestDTO,
    use_case: AdminUseCase = Depends(get_admin_use_case)
):
    """UC12 — Khóa/Mở khóa tài khoản sinh viên (Admin only)."""
    result = use_case.update_user_status(user_id=user_id, is_active=request.is_active)
    return result


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: uuid.UUID,
    request: UserRoleUpdateRequestDTO,
    use_case: AdminUseCase = Depends(get_admin_use_case)
):
    """Cấp/Đổi quyền cho người dùng (Admin only)."""
    result = use_case.update_user_role(user_id=user_id, role=request.role)
    return result


@router.get("/challenges/{challenge_id}/submissions", response_model=SubmissionListResponseDTO)
async def list_all_submissions(
    challenge_id: uuid.UUID,
    page: int = 1,
    size: int = 20,
    use_case: AdminUseCase = Depends(get_admin_use_case),
):
    """UC11 — Admin xem tất cả bài nộp của 1 Challenge (có file_url để tải)."""
    return use_case.list_all_submissions(challenge_id=challenge_id, page=page, size=size)


@router.get("/challenges/{challenge_id}/export-leaderboard")
async def export_leaderboard(
    challenge_id: uuid.UUID,
    leaderboard_type: str = Query("private", alias="type"),
    use_case: AdminUseCase = Depends(get_admin_use_case),
):
    """Admin — Xuất Bảng xếp hạng ra file CSV (utf-8-sig, Excel-compatible)."""
    t0 = time.time()
    csv_content, filename = use_case.export_leaderboard_csv(challenge_id, leaderboard_type)
    logger.info(
        "export_leaderboard challenge=%s type=%s rows=%d elapsed_ms=%.0f",
        challenge_id, leaderboard_type, csv_content.count("\\n") - 1, (time.time() - t0) * 1000,
    )
    return Response(
        content=csv_content.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
