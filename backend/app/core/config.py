"""
Core Configuration — ICTU AI JUDGE
Đọc toàn bộ cấu hình từ biến môi trường (.env).
Sử dụng pydantic-settings để validate kiểu dữ liệu tự động.
"""
import logging
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ---- App ----
    APP_ENV: str = "development"
    DEBUG: bool = True
    PROJECT_NAME: str = "ICTU AI JUDGE"
    API_V1_PREFIX: str = "/api/v1"
    FRONTEND_URL: str = "http://localhost:5173"

    # ---- Database ----
    DATABASE_URL: str

    # ---- Redis & Celery ----
    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/2"

    # ---- S3 / MinIO Storage ----
    S3_ENDPOINT_URL: str = "http://minio:9000"
    # URL công khai để browser truy cập presigned URL (thay thế S3_ENDPOINT_URL trong URL)
    # Docker internal: minio:9000 → browser không thể truy cập trực tiếp
    # Dev local: http://localhost:9000 | Production: https://storage.example.com
    S3_PUBLIC_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_BUCKET_NAME: str = "ictu-ai-judge-bucket"

    # ---- Security / JWT ----
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 giờ — dev-friendly (production nên set qua .env)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    COOKIE_NAME: str = "access_token"

    # ---- Google OAuth ----
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # ---- Authorization ----
    ROOT_ADMIN_EMAIL: str | None = None
    # Email duy nhất được tự động gán quyền ADMIN khi đăng nhập lần đầu qua Google OAuth.

    # ---- SMTP / Mailer ----
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None
    # Để trống hoặc không set để tắt tính năng Root Admin tự động.

    # ---- Submission Defaults ----
    DEFAULT_RATE_LIMIT_MINUTES: int = 10
    DEFAULT_MAX_FILE_SIZE_MB: int = 50

    # ---- Worker ----
    WORKER_TIMEOUT_SECONDS: int = 300  # 5 phút — sau đó Cronjob chuyển sang FAILED
    SANDBOX_MEMORY_LIMIT: str = "512m"
    SANDBOX_CPU_PERIOD: int = 100000
    SANDBOX_CPU_QUOTA: int = 50000  # 50% CPU
    # Sandbox timeout cho các challenge cần giải nén zip (giây)
    SANDBOX_ZIP_TIMEOUT: int = 120  # 2 phút — đủ cho giải nén + metric ảnh
    # Giới hạn giải nén zip (chống zip bomb)
    ZIP_MAX_UNCOMPRESSED_MB: int = 500
    ZIP_MAX_FILE_COUNT: int = 10000


@lru_cache
def get_settings() -> Settings:
    """
    Trả về Settings singleton (cache bằng lru_cache).
    Inject vào Use Case qua FastAPI Depends.
    """
    _settings = Settings()
    logger.info(
        "Settings loaded — APP_ENV=%s, DEBUG=%s",
        _settings.APP_ENV,
        _settings.DEBUG,
    )
    return _settings
