"""
S3/MinIO Storage Repository Adapter.
Implements IStorageRepository — upload, download, delete file lên MinIO.
[SECURITY] Dùng presigned URL cho download, không expose endpoint trực tiếp.
"""
import logging

import boto3
from botocore.exceptions import ClientError

from app.application.interfaces.repositories import IStorageRepository
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class S3StorageRepository(IStorageRepository):
    """
    MinIO/S3 Storage Adapter.
    Dùng boto3 client — tương thích hoàn toàn với MinIO và AWS S3.
    """

    def __init__(self):
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
        )
        self._bucket = settings.S3_BUCKET_NAME
        self._ensure_bucket()

    # ==========================================
    # Private helpers
    # ==========================================

    def _ensure_bucket(self) -> None:
        """Tạo bucket nếu chưa tồn tại (idempotent, dùng khi startup).
        Nếu MinIO/S3 chưa chạy (dev mode), chỉ log warning, không raise.
        """
        try:
            self._client.head_bucket(Bucket=self._bucket)
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code in ("404", "NoSuchBucket"):
                try:
                    self._client.create_bucket(Bucket=self._bucket)
                    logger.info("S3 bucket '%s' created.", self._bucket)
                except Exception as create_err:
                    logger.warning("S3 bucket create failed (MinIO unavailable?): %s", create_err)
            else:
                logger.warning("S3 bucket check failed: %s", e)
        except Exception as e:
            # EndpointConnectionError khi MinIO chưa chạy — không crash server
            logger.warning(
                "S3 storage unavailable (endpoint=%s). "
                "Upload/Download sẽ lỗi khi dùng. Error: %s",
                settings.S3_ENDPOINT_URL, e,
            )

    # ==========================================
    # IStorageRepository interface
    # ==========================================

    def upload(self, key: str, data: bytes, content_type: str = "text/csv") -> str:
        """
        Upload bytes lên S3/MinIO.
        Trả về key (object path) — không phải presigned URL,
        vì Worker cần download lại qua internal endpoint.
        """
        try:
            self._client.put_object(
                Bucket=self._bucket,
                Key=key,
                Body=data,
                ContentType=content_type,
            )
            logger.info("S3 upload OK — bucket=%s key=%s size=%d", self._bucket, key, len(data))
            return key
        except ClientError as e:
            logger.error("S3 upload FAILED — key=%s error=%s", key, e)
            raise RuntimeError(f"Không thể upload file lên storage: {e}") from e

    def download(self, key: str) -> bytes:
        """
        Download bytes từ S3/MinIO theo key.
        Được Worker dùng để tải submission CSV + ground truth.
        """
        try:
            response = self._client.get_object(Bucket=self._bucket, Key=key)
            data = response["Body"].read()
            logger.debug("S3 download OK — key=%s size=%d", key, len(data))
            return data
        except ClientError as e:
            logger.error("S3 download FAILED — key=%s error=%s", key, e)
            raise RuntimeError(f"Không thể tải file từ storage: {e}") from e

    def delete(self, key: str) -> None:
        """Xóa object khỏi S3/MinIO (dùng trong cleanup task UC15)."""
        try:
            self._client.delete_object(Bucket=self._bucket, Key=key)
            logger.info("S3 delete OK — key=%s", key)
        except ClientError as e:
            logger.warning("S3 delete FAILED — key=%s error=%s", key, e)

    def stream_download(self, key: str):
        """
        Stream bytes từ S3/MinIO.
        Trả về một generator để stream thẳng về client qua FastAPI StreamingResponse.
        """
        try:
            response = self._client.get_object(Bucket=self._bucket, Key=key)
            # boto3's get_object returns a botocore.response.StreamingBody
            return response["Body"].iter_chunks(chunk_size=1024 * 64) # 64KB chunks
        except ClientError as e:
            logger.error("S3 stream FAILED — key=%s error=%s", key, e)
            raise RuntimeError(f"Không thể tải file từ storage: {e}") from e

    def get_download_url(self, key: str, filename: str | None = None) -> str:
        """
        Trả về endpoint download qua proxy của Backend thay vì presigned URL của MinIO.
        Frontend gọi tới backend endpoint, backend sẽ dùng stream_download để trả về.
        """
        url = f"{settings.API_V1_PREFIX}/storage/download?key={key}"
        if filename:
            import urllib.parse
            url += f"&filename={urllib.parse.quote(filename)}"
        return url
