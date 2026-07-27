import logging
import boto3
from botocore.exceptions import ClientError
from app.core.config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_minio():
    settings = get_settings()
    client = boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
    )
    bucket_name = settings.S3_BUCKET_NAME
    
    try:
        client.head_bucket(Bucket=bucket_name)
        logger.info(f"S3 bucket '{bucket_name}' already exists.")
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        if error_code in ("404", "NoSuchBucket"):
            client.create_bucket(Bucket=bucket_name)
            logger.info(f"S3 bucket '{bucket_name}' created successfully.")
        else:
            logger.error(f"Failed to check/create S3 bucket: {e}")
            raise

if __name__ == "__main__":
    logger.info("Initializing MinIO...")
    init_minio()
    logger.info("MinIO initialization complete.")
