"""
Submission DTOs (Data Transfer Objects) — UC04, UC05, UC06.
Pydantic schemas cho Request/Response của Submission API.
"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.domain.entities.entities import SubmissionStatus


# ==========================================
# REQUEST DTOs
# ==========================================

class SelectForPrivateRequestDTO(BaseModel):
    """UC05 — Body khi PATCH /submissions/{id} để chọn bài Private."""
    is_selected_for_private: bool = Field(
        True,
        description="Đặt True để chọn bài này làm bài tính điểm chung cuộc.",
    )


# ==========================================
# RESPONSE DTOs
# ==========================================

class SubmissionResponseDTO(BaseModel):
    """Response trả về sau khi nộp bài (UC04) hoặc xem chi tiết."""
    id: uuid.UUID
    challenge_id: uuid.UUID
    team_id: uuid.UUID
    submitted_by: uuid.UUID
    file_url: str | None = None
    file_md5_hash: str
    file_size_bytes: int
    status: SubmissionStatus
    submitted_at: datetime
    public_score: Optional[float] = None
    private_score: Optional[float] = None
    source_code_url: Optional[str] = None
    is_selected_for_private: bool = False
    execution_time_ms: Optional[int] = None
    error_message: Optional[str] = None

    model_config = {"from_attributes": True}


class SubmitResponseDTO(BaseModel):
    """HTTP 201 — Response tức thì sau khi nộp bài thành công."""
    submission_id: uuid.UUID
    status: SubmissionStatus = SubmissionStatus.PENDING
    message: str = "Nộp bài thành công. Kết quả sẽ được cập nhật sau vài giây."


class SelectForPrivateResponseDTO(BaseModel):
    """UC05 — Response sau khi chọn bài Private."""
    submission_id: uuid.UUID
    is_selected_for_private: bool
    message: str


class SourceCodeUploadResponseDTO(BaseModel):
    """UC06 — Response sau khi upload source code."""
    submission_id: uuid.UUID
    source_code_url: str
    message: str = "Upload source code thành công."


class SubmissionListResponseDTO(BaseModel):
    """Response cho danh sách submissions của team."""
    total_count: int
    page: int
    size: int
    data: list[SubmissionResponseDTO]
