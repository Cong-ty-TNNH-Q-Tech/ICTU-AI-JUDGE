"""
Submissions Router — UC05 (select for private), UC06 (source code upload).
[OWNER] Thành viên phụ trách: Submission Module
"""
import logging
import uuid

from fastapi import APIRouter, Depends, File, UploadFile

from app.application.dtos.submission_dtos import (
    SelectForPrivateRequestDTO,
    SelectForPrivateResponseDTO,
    SourceCodeUploadResponseDTO,
)
from app.application.use_cases.submission_use_case import SubmissionUseCase
from app.entrypoints.dependencies import get_current_user_id, get_submission_use_case

logger = logging.getLogger(__name__)
router = APIRouter()


# ==========================================
# UC05 — Chọn bài tính điểm Private
# ==========================================

@router.patch("/{submission_id}", response_model=SelectForPrivateResponseDTO)
async def select_for_private(
    submission_id: uuid.UUID,
    body: SelectForPrivateRequestDTO,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: SubmissionUseCase = Depends(get_submission_use_case),
):
    """
    UC05 — Tick chọn bài tính điểm chung cuộc (is_selected_for_private).
    - Tự động bỏ chọn submission cũ của cùng team+challenge.
    - Chỉ được chọn TRƯỚC khi challenge kết thúc (HTTP 403 nếu đã qua deadline).
    """
    return use_case.select_for_private(
        submission_id=submission_id,
        user_id=user_id,
        is_selected=body.is_selected_for_private,
    )


# ==========================================
# UC06 — Nộp Source Code
# ==========================================

@router.post("/{submission_id}/source-code", response_model=SourceCodeUploadResponseDTO)
async def upload_source_code(
    submission_id: uuid.UUID,
    files: list[UploadFile] = File(
        ...,
        description="Các file source code (.zip, .ipynb, .py, .txt, Dockerfile). Tối đa 50MB tổng.",
    ),
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: SubmissionUseCase = Depends(get_submission_use_case),
):
    """
    UC06 — Nộp Source Code cuối kỳ (Top N Teams).
    - Chấp nhận nhiều files: .zip, .ipynb, .py, .txt, Dockerfile.
    - Tất cả sẽ được nén thành một file ZIP in-memory rồi lưu lên S3.
    - Chỉ cho phép SAU KHI challenge kết thúc (HTTP 403 nếu chưa kết thúc).
    """
    file_tuples = []
    for f in files:
        data = await f.read()
        file_tuples.append((f.filename or "file", data, f.content_type or "application/octet-stream"))

    return use_case.upload_source_code(
        submission_id=submission_id,
        user_id=user_id,
        files=file_tuples,
    )
