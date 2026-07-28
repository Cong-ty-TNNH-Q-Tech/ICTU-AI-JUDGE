"""
Storage Router — Proxy cho việc tải file từ MinIO thông qua Backend.
Tránh việc expose trực tiếp MinIO ra bên ngoài.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse

from app.application.interfaces.repositories import IStorageRepository
from app.entrypoints.dependencies import get_storage_repository

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/download")
async def download_file(
    key: str = Query(..., description="Đường dẫn (key) của file trên storage"),
    filename: Optional[str] = Query(None, description="Tên file tùy chọn khi tải xuống"),
    storage_repo: IStorageRepository = Depends(get_storage_repository)
):
    """
    Proxy endpoint để tải file từ MinIO thông qua Backend.
    Dùng StreamingResponse để tiết kiệm RAM.
    """
    try:
        # stream_download trả về một generator của chunks (64KB/chunk)
        stream = storage_repo.stream_download(key)
        
        headers = {}
        if filename:
            import urllib.parse
            # Bắt buộc quote để xử lý tên file có dấu hoặc khoảng trắng
            safe_filename = urllib.parse.quote(filename)
            headers["Content-Disposition"] = f"attachment; filename*=UTF-8''{safe_filename}"
            headers["Access-Control-Expose-Headers"] = "Content-Disposition"
            
        return StreamingResponse(
            stream,
            media_type="application/octet-stream",
            headers=headers
        )
    except RuntimeError as e:
        logger.error("Download proxy failed: %s", e)
        raise HTTPException(status_code=404, detail="File không tồn tại hoặc không thể tải.")
