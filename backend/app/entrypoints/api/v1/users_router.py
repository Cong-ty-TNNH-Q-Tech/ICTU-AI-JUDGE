"""
Users Router — UC01 (me), UC07 (my teams), Issue #30 (Profile).
[OWNER] Thành viên phụ trách: User Module
"""
import logging
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.application.dtos.profile_dtos import (
    AvatarUploadResponseDTO,
    UpdateProfileRequest,
    UserProfileDTO,
    UserSolutionDTO,
)
from app.application.use_cases.profile_use_case import ProfileUseCase
from app.domain.entities.entities import UserEntity
from app.entrypoints.dependencies import (
    get_current_user,
    get_db,
    get_profile_use_case,
)

logger = logging.getLogger(__name__)
router = APIRouter()


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    github_url: str | None = None
    linkedin_url: str | None = None
    avatar_url: str | None = None


# ==========================================
# GET /me — Thông tin user hiện tại
# ==========================================

@router.get("/me", response_model=UserResponse)
async def get_me(user: UserEntity = Depends(get_current_user)):
    """Lấy thông tin user hiện tại từ JWT Cookie."""
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        github_url=user.github_url,
        linkedin_url=user.linkedin_url,
        avatar_url=user.avatar_url,
    )


# ==========================================
# GET /me/teams — Danh sách đội thi
# ==========================================

@router.get("/me/teams")
async def get_my_teams(page: int = 1, size: int = 20, db: Session = Depends(get_db)):
    """Lấy danh sách Đội thi của user hiện tại (phân trang)."""
    # TODO: Implement — Issue #UC07
    return {"items": [], "total": 0, "page": page, "size": size, "total_pages": 0}


# ==========================================
# Issue #30 — Profile endpoints
# ==========================================

@router.get("/{user_id}/profile", response_model=UserProfileDTO)
async def get_profile(
    user_id: uuid.UUID,
    use_case: ProfileUseCase = Depends(get_profile_use_case),
):
    """
    Xem hồ sơ công khai của user — kèm thống kê thi đấu.
    Không yêu cầu đăng nhập.
    """
    try:
        return use_case.get_profile(user_id)
    except LookupError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Người dùng không tồn tại.",
        )


@router.patch("/me/profile", response_model=UserProfileDTO)
async def update_profile(
    payload: UpdateProfileRequest,
    user: UserEntity = Depends(get_current_user),
    use_case: ProfileUseCase = Depends(get_profile_use_case),
):
    """
    Cập nhật hồ sơ cá nhân (Github URL, LinkedIn URL).
    Yêu cầu đăng nhập.
    """
    try:
        result = use_case.update_profile(user, payload)
    except (ValueError, LookupError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    return result


@router.post("/me/avatar", response_model=AvatarUploadResponseDTO)
async def upload_avatar(
    file: UploadFile = File(...),
    user: UserEntity = Depends(get_current_user),
    use_case: ProfileUseCase = Depends(get_profile_use_case),
):
    """
    Upload ảnh đại diện (jpg/png/webp, max 2MB).
    Sau khi upload, Frontend cập nhật Zustand store → Header hiển thị avatar mới ngay lập tức.
    """
    file_bytes = await file.read()
    filename = file.filename or "avatar.jpg"
    content_type = file.content_type or "image/jpeg"

    try:
        result = use_case.upload_avatar(
            current_user=user,
            file_bytes=file_bytes,
            filename=filename,
            content_type=content_type,
        )
    except ValueError as e:
        status_code = (
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            if "quá lớn" in str(e)
            else status.HTTP_422_UNPROCESSABLE_ENTITY
        )
        raise HTTPException(status_code=status_code, detail=str(e))

    return result


@router.get("/{user_id}/solutions", response_model=list[UserSolutionDTO])
def get_user_solutions(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Danh sách Solutions đã đăng của user (kèm tên cuộc thi). Public endpoint.
    """
    from app.adapters.database.solution_repository import PostgresSolutionRepository
    repo = PostgresSolutionRepository(db)
    rows = repo.list_by_user(user_id)
    return [UserSolutionDTO(**row) for row in rows]
