"""
Challenges Router — UC03 (enroll), UC09 (CRUD), UC10 (participants).
[OWNER] Thành viên phụ trách: Challenge Module
TODO: Implement các endpoint bên dưới
"""
import logging
import uuid

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.entrypoints.dependencies import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("")
async def list_challenges(
    status: str | None = None,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
):
    """Danh sách bài thi (phân trang). Public endpoint."""
    # TODO: Implement
    raise NotImplementedError("Challenges router — chưa implement")


@router.post("")
async def create_challenge(db: Session = Depends(get_db)):
    """UC09 — Tạo bài thi mới (Admin only)."""
    # TODO: Validate Admin role từ JWT cookie
    raise NotImplementedError("Challenges router — chưa implement")


@router.get("/{challenge_id}")
async def get_challenge(challenge_id: uuid.UUID, db: Session = Depends(get_db)):
    """Chi tiết bài thi."""
    # TODO: Implement
    raise NotImplementedError("Challenges router — chưa implement")


@router.patch("/{challenge_id}")
async def update_challenge(challenge_id: uuid.UUID, db: Session = Depends(get_db)):
    """UC09 — Cập nhật bài thi (Admin only). Bị khóa nếu đã có Submission."""
    # TODO: Implement
    raise NotImplementedError("Challenges router — chưa implement")


@router.delete("/{challenge_id}")
async def delete_challenge(challenge_id: uuid.UUID, db: Session = Depends(get_db)):
    """UC09 — Soft delete bài thi (Admin only)."""
    # TODO: Implement
    raise NotImplementedError("Challenges router — chưa implement")


@router.post("/{challenge_id}/upload-secrets")
async def upload_secrets(
    challenge_id: uuid.UUID,
    ground_truth_csv: UploadFile = File(...),
    metric_script_py: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    """Upload Ground Truth + Custom Metric (Admin only, lưu kín trên S3)."""
    # TODO: Implement
    raise NotImplementedError("Challenges router — chưa implement")


@router.post("/{challenge_id}/enroll")
async def enroll(challenge_id: uuid.UUID, db: Session = Depends(get_db)):
    """UC03 — Ghi danh vào Public Challenge (tự động tạo Team of 1)."""
    # TODO: Implement
    raise NotImplementedError("Challenges router — chưa implement")


@router.get("/{challenge_id}/participants")
async def list_participants(
    challenge_id: uuid.UUID,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
):
    """UC10 — Xem Whitelist (Admin only)."""
    # TODO: Implement
    raise NotImplementedError("Challenges router — chưa implement")


@router.post("/{challenge_id}/participants")
async def add_participants(challenge_id: uuid.UUID, db: Session = Depends(get_db)):
    """UC10 — Thêm sinh viên vào Whitelist (Admin only)."""
    # TODO: Implement
    raise NotImplementedError("Challenges router — chưa implement")


@router.get("/{challenge_id}/submissions")
async def list_submissions(
    challenge_id: uuid.UUID,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
):
    """UC04 — Lịch sử nộp bài của Đội (cần auth)."""
    # TODO: Implement
    raise NotImplementedError("Challenges router — chưa implement")


@router.post("/{challenge_id}/submissions")
async def submit(
    challenge_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    UC04 — Nộp bài dự thi.
    Pipeline: validate → MD5 hash → size check → rate limit → lưu S3 → lưu DB → push Redis.
    """
    # TODO: Implement — Đây là endpoint quan trọng nhất
    raise NotImplementedError("Challenges router — chưa implement")


@router.get("/{challenge_id}/leaderboard")
async def get_leaderboard(
    challenge_id: uuid.UUID,
    type: str = "public",
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
):
    """UC07 — Bảng xếp hạng Public/Private (phân trang)."""
    # TODO: Implement
    raise NotImplementedError("Challenges router — chưa implement")
