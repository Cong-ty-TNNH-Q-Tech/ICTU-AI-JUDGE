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
from app.domain.entities.entities import ContestStatus, UserEntity, UserRole
from app.domain.exceptions.exceptions import NotFoundError
from app.entrypoints.dependencies import (
    get_contest_use_case,
    get_optional_current_user,
    require_admin,
)

router = APIRouter(tags=["Contests"])


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
def _not_found(exc: NotFoundError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


def _hidden_as_404() -> HTTPException:
    """Tra ve 404 thay vi 403 de tranh enumerate DRAFT/ARCHIVED contest IDs."""
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contest not found.")


def _is_admin(user: Optional[UserEntity]) -> bool:
    """Helper: kiem tra user co role ADMIN khong."""
    return user is not None and user.role == UserRole.ADMIN


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------

@router.get("", response_model=ContestListResponseDTO)
def get_contests(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    # [FIX #2] Optional[ContestStatus] thay vi str -> FastAPI validate, tra 422 neu nonsense
    status: Optional[ContestStatus] = Query(None),
    use_case: ContestUseCase = Depends(get_contest_use_case),
    # [FIX #1] get_optional_current_user (UserEntity) thay vi chi UUID de kiem tra role
    current_user: Optional[UserEntity] = Depends(get_optional_current_user),
):
    """
    Danh sach cuoc thi (phan trang, loc theo status). Public endpoint.
    - Admin: co the dung ?status=DRAFT|PUBLISHED|ARCHIVED.
    - Student da dang nhap + Anonymous: LUON chi thay PUBLISHED, bat ke ?status= truyen vao.
    """
    # [SECURITY] Chi Admin moi duoc filter theo status tuy y
    # Student co JWT hop le van bi force PUBLISHED -- khong the enumerate DRAFT/ARCHIVED
    if _is_admin(current_user):
        effective_status = status.value if status is not None else None
    else:
        effective_status = ContestStatus.PUBLISHED.value

    return use_case.get_list(page, size, effective_status)


@router.get("/{contest_id}", response_model=ContestResponseDTO)
def get_contest_detail(
    contest_id: uuid.UUID,
    use_case: ContestUseCase = Depends(get_contest_use_case),
    current_user: Optional[UserEntity] = Depends(get_optional_current_user),
):
    """
    Chi tiet mot cuoc thi.
    Security policy:
    - Admin: thay tat ca status (DRAFT, PUBLISHED, ARCHIVED).
    - Authenticated student / Anonymous: chi thay PUBLISHED.
      Tra 404 thay vi 403 de tranh enumerate contest IDs.
    """
    try:
        contest = use_case.get_detail(contest_id)
    except NotFoundError as exc:
        raise _not_found(exc)

    # [SECURITY] Chi Admin moi thay DRAFT/ARCHIVED
    if not _is_admin(current_user) and contest.status != ContestStatus.PUBLISHED:
        raise _hidden_as_404()

    return contest


@router.get("/{contest_id}/challenges", response_model=ContestChallengesResponseDTO)
def get_contest_challenges(
    contest_id: uuid.UUID,
    use_case: ContestUseCase = Depends(get_contest_use_case),
    current_user: Optional[UserEntity] = Depends(get_optional_current_user),
):
    """
    Danh sach Challenges thuoc mot cuoc thi.
    Ap dung cung security policy voi get_contest_detail:
    Admin thay tat ca, Student/Anonymous chi thay challenges cua PUBLISHED contest.
    """
    try:
        contest = use_case.get_detail(contest_id)
    except NotFoundError as exc:
        raise _not_found(exc)

    if not _is_admin(current_user) and contest.status != ContestStatus.PUBLISHED:
        raise _hidden_as_404()

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
    """Tao cuoc thi moi. Admin only."""
    try:
        return use_case.create(dto, admin.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))


@router.patch("/{contest_id}", response_model=ContestResponseDTO)
def update_contest(
    contest_id: uuid.UUID,
    dto: ContestUpdateDTO,
    use_case: ContestUseCase = Depends(get_contest_use_case),
    admin: UserEntity = Depends(require_admin),
):
    """Cap nhat thong tin cuoc thi. Admin only."""
    try:
        return use_case.update(contest_id, dto)
    except NotFoundError as exc:
        raise _not_found(exc)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))


@router.delete("/{contest_id}", status_code=204)
def delete_contest(
    contest_id: uuid.UUID,
    use_case: ContestUseCase = Depends(get_contest_use_case),
    admin: UserEntity = Depends(require_admin),
):
    """Xoa mem cuoc thi (soft delete). Admin only."""
    try:
        use_case.delete(contest_id)
    except NotFoundError as exc:
        raise _not_found(exc)
