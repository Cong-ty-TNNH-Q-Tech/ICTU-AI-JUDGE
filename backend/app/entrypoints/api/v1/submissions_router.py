"""
Submissions Router — UC05 (select for private), UC06 (source code upload).
[OWNER] Thành viên phụ trách: Submission Module
TODO: Implement các endpoint bên dưới
"""
import logging
import uuid

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.entrypoints.dependencies import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


@router.patch("/{submission_id}")
async def select_for_private(submission_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    UC05 — Tick chọn bài tính điểm chung cuộc (is_selected_for_private).
    Chỉ được chọn trước deadline cuộc thi.
    """
    # TODO: Implement
    raise NotImplementedError("Submissions router — chưa implement")


@router.post("/{submission_id}/source-code")
async def upload_source_code(
    submission_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    UC06 — Nộp Source Code cuối kỳ (Top N Teams).
    Bắt buộc kèm requirements.txt trong ZIP.
    """
    # TODO: Implement
    raise NotImplementedError("Submissions router — chưa implement")
