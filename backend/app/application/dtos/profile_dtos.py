"""
Profile DTOs — Issue #30: Hồ sơ cá nhân (View & Update Profile).
Dựa trên đặc tả docs/openapi.yaml — schemas UserProfile, UpdateProfileRequest.
"""
import uuid
import datetime
from typing import Optional
from pydantic import BaseModel, HttpUrl, field_validator


class UserProfileDTO(BaseModel):
    """Trả về từ GET /users/{id}/profile — thông tin + stats tổng hợp."""
    id: uuid.UUID
    email: str
    full_name: str
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    avatar_url: Optional[str] = None  # Presigned URL (generated on-the-fly từ S3 key)
    # Thống kê thi đấu
    total_submissions: int = 0
    total_solutions: int = 0
    best_rank: Optional[int] = None  # None nếu chưa từng lên bảng xếp hạng


class UpdateProfileRequest(BaseModel):
    """Body PATCH /users/me/profile."""
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None

    @field_validator("github_url", "linkedin_url", mode="before")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        # Chấp nhận URL https:// hoặc rỗng (để xóa)
        if not v.startswith(("https://", "http://")):
            raise ValueError("URL phải bắt đầu bằng https:// hoặc http://")
        return v


class AvatarUploadResponseDTO(BaseModel):
    """Trả về từ POST /users/me/avatar."""
    avatar_url: str  # Presigned URL để hiển thị ngay trên Frontend
