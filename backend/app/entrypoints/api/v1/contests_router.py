import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.application.dtos.contest_dtos import (
    ContestChallengesResponseDTO,
    ContestCreateDTO,
    ContestListResponseDTO,
    ContestResponseDTO,
    ContestUpdateDTO,
)
from app.application.use_cases.contest_use_case import ContestUseCase
from app.domain.entities.entities import UserEntity
from app.domain.exceptions.exceptions import NotFoundError
from app.entrypoints.dependencies import (
    get_contest_use_case,
    get_optional_current_user_id,
    require_admin,
)

router = APIRouter(tags=["Contests"])


# ------------------------------------------------------------------
# Helper: map NotFoundError → HTTP 404
# ------------------------------------------------------------------
def _not_found(exc: NotFoundError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get("", response_model=ContestListResponseDTO)
def get_contests(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    use_case: ContestUseCase = Depends(get_contest_use_case),
    current_user_id: Optional[uuid.UUID] = Depends(get_optional_current_user_id),
):
    """
    Danh sách cuộc thi (có phân trang, lọc theo status). Public.
    Unauthenticated users LUÔN chỉ thấy PUBLISHED contests —
    bất kể ?status= gì được truyền vào (ngăn DRAFT leak).
    """
    effective_status = status
    if current_user_id is None:
        # [SECURITY] Force PUBLISHED cho mọi anonymous request,
        # kể cả khi ?status=DRAFT được truyền tường minh
        effective_status = "PUBLISHED"
    return use_case.get_list(page, size, effective_status)


@router.get("/{contest_id}", response_model=ContestResponseDTO)
def get_contest_detail(
    contest_id: uuid.UUID,
    use_case: ContestUseCase = Depends(get_contest_use_case),
):
    """Chi tiết một cuộc thi. Public."""
    try:
        return use_case.get_detail(contest_id)
    except NotFoundError as exc:
        raise _not_found(exc)


@router.get("/{contest_id}/challenges", response_model=ContestChallengesResponseDTO)
def get_contest_challenges(
    contest_id: uuid.UUID,
    use_case: ContestUseCase = Depends(get_contest_use_case),
):
    """Danh sách Challenges (bài thi con) thuộc một cuộc thi. Public."""
    try:
        return use_case.get_challenges(contest_id)
    except NotFoundError as exc:
        raise _not_found(exc)


@router.post("", response_model=ContestResponseDTO, status_code=201)
def create_contest(
    dto: ContestCreateDTO,
    use_case: ContestUseCase = Depends(get_contest_use_case),
    admin: UserEntity = Depends(require_admin),
):
    """Tạo cuộc thi mới. Admin only."""
    try:
        return use_case.create(dto, admin.id)
    except ValueError as exc:
        # end_time <= start_time — trả 422 thay vì 500
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))


@router.patch("/{contest_id}", response_model=ContestResponseDTO)
def update_contest(
    contest_id: uuid.UUID,
    dto: ContestUpdateDTO,
    use_case: ContestUseCase = Depends(get_contest_use_case),
    admin: UserEntity = Depends(require_admin),
):
    """Cập nhật thông tin cuộc thi. Admin only."""
    try:
        return use_case.update(contest_id, dto)
    except NotFoundError as exc:
        raise _not_found(exc)
    except ValueError as exc:
        # end_time <= start_time — trả 422 thay vì 500
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))


@router.delete("/{contest_id}", status_code=204)
def delete_contest(
    contest_id: uuid.UUID,
    use_case: ContestUseCase = Depends(get_contest_use_case),
    admin: UserEntity = Depends(require_admin),
):
    """Xoá mềm cuộc thi (soft delete). Admin only."""
    try:
        use_case.delete(contest_id)
    except NotFoundError as exc:
        raise _not_found(exc)
