"""
Submissions Router — UC05 (select for private), UC06 (source code upload).
[OWNER] Thành viên phụ trách: Submission Module
"""
import logging
import uuid

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.adapters.database.challenge_repository import SQLChallengeRepository
from app.adapters.database.submission_repository import SQLSubmissionRepository
from app.adapters.database.team_repository import SQLTeamRepository
from app.adapters.storage.s3_repository import S3StorageRepository
from app.application.dtos.submission_dtos import (
    SelectForPrivateRequestDTO,
    SelectForPrivateResponseDTO,
    SourceCodeUploadResponseDTO,
)
from app.application.use_cases.submission_use_case import SubmissionUseCase
from app.entrypoints.dependencies import get_current_user_id, get_db

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_submission_use_case(db: Session) -> SubmissionUseCase:
    return SubmissionUseCase(
        submission_repo=SQLSubmissionRepository(db),
        challenge_repo=SQLChallengeRepository(db),
        team_repo=SQLTeamRepository(db),
        storage_repo=S3StorageRepository(),
    )


@router.patch("/{submission_id}", response_model=SelectForPrivateResponseDTO)
async def select_for_private(
    submission_id: uuid.UUID,
    body: SelectForPrivateRequestDTO,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    """
    UC05 — Tick chọn bài tính điểm chung cuộc (is_selected_for_private).
    Chỉ được chọn trước deadline cuộc thi.
    """
    use_case = _get_submission_use_case(db)
    result = use_case.select_for_private(
        submission_id=submission_id,
        user_id=user_id,
    )
    db.commit()
    return result


@router.post("/{submission_id}/source-code", response_model=SourceCodeUploadResponseDTO)
async def upload_source_code(
    submission_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    """
    UC06 — Nộp Source Code cuối kỳ (Top N Teams).
    Bắt buộc kèm requirements.txt trong ZIP hoặc file .ipynb.
    """
    file_bytes = await file.read()
    filename = file.filename or "source_code.zip"
    content_type = file.content_type or "application/zip"

    use_case = _get_submission_use_case(db)
    result = use_case.upload_source_code(
        submission_id=submission_id,
        user_id=user_id,
        file_bytes=file_bytes,
        filename=filename,
        content_type=content_type,
    )
    db.commit()
    return result
