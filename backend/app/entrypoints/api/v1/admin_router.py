"""
Admin Router — UC12 (Quản lý sinh viên), UC13 (Thảo luận).
[OWNER] Thành viên phụ trách: Admin Module
"""
import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.adapters.database.challenge_repository import SQLChallengeRepository
from app.adapters.database.submission_repository import SQLSubmissionRepository
from app.adapters.database.user_repository import SQLUserRepository
from app.application.dtos.admin_dtos import UserListResponseDTO, UserStatusUpdateRequestDTO
from app.application.dtos.submission_dtos import SubmissionListResponseDTO
from app.application.use_cases.admin_use_case import AdminUseCase
from app.entrypoints.dependencies import get_db, require_admin

logger = logging.getLogger(__name__)
router = APIRouter(dependencies=[Depends(require_admin)])


def _get_admin_use_case(db: Session) -> AdminUseCase:
    return AdminUseCase(
        user_repo=SQLUserRepository(db),
        challenge_repo=SQLChallengeRepository(db),
        submission_repo=SQLSubmissionRepository(db),
    )


@router.get("/users", response_model=UserListResponseDTO)
async def list_users(
    q: str = "",
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
):
    """UC12 — Danh sách sinh viên (Admin only). Tìm kiếm theo email/họ tên."""
    use_case = _get_admin_use_case(db)
    return use_case.list_users(q=q, page=page, size=size)


@router.patch("/users/{user_id}")
async def update_user_status(
    user_id: uuid.UUID,
    request: UserStatusUpdateRequestDTO,
    db: Session = Depends(get_db)
):
    """UC12 — Khóa/Mở khóa tài khoản sinh viên (Admin only)."""
    use_case = _get_admin_use_case(db)
    result = use_case.update_user_status(user_id=user_id, is_active=request.is_active)
    db.commit()
    return result


@router.get("/challenges/{challenge_id}/submissions", response_model=SubmissionListResponseDTO)
async def list_all_submissions(
    challenge_id: uuid.UUID,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
):
    """UC11 — Admin xem tất cả bài nộp của 1 Challenge (có file_url để tải)."""
    use_case = _get_admin_use_case(db)
    return use_case.list_all_submissions(challenge_id=challenge_id, page=page, size=size)
