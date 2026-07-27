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

    def get_presigned_url(self, key: str, expires_in: int = 3600, filename: str | None = None) -> str:
        """
        Tạo presigned URL cho phép Frontend download trực tiếp (không qua API).
        Tự động thay thế internal Docker hostname (S3_ENDPOINT_URL)
        bằng public-facing URL (S3_PUBLIC_ENDPOINT_URL) để browser có thể truy cập.
        """
        try:
            params: dict = {"Bucket": self._bucket, "Key": key}
            if filename:
                params["ResponseContentDisposition"] = f'attachment; filename="{filename}"'
                params["ResponseContentType"] = "application/x-ipynb+json"
            url = self._client.generate_presigned_url(
                "get_object",
                Params=params,
                ExpiresIn=expires_in,
            )
            # Thay internal endpoint (http://minio:9000) bằng public URL
            # để browser có thể truy cập từ bên ngoài Docker network
            if settings.S3_PUBLIC_ENDPOINT_URL != settings.S3_ENDPOINT_URL:
                url = url.replace(settings.S3_ENDPOINT_URL, settings.S3_PUBLIC_ENDPOINT_URL)
            return url
        except ClientError as e:
            logger.error("S3 presign FAILED — key=%s error=%s", key, e)
            raise RuntimeError(f"Không thể tạo presigned URL: {e}") from e
