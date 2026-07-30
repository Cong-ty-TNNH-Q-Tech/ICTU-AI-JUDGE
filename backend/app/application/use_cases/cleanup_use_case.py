"""
Cleanup Use Cases — UC15
"""
import logging
from datetime import datetime
import uuid

from app.application.interfaces.repositories import ISubmissionRepository, IStorageRepository

logger = logging.getLogger(__name__)

class CleanupStaleStorageUseCase:
    """
    UC15: Dọn dẹp các file nộp cũ không còn giá trị trên S3 để tiết kiệm chi phí.
    Các file nộp cũ (stale) là những file:
    1. Đã nộp được 1 khoảng thời gian (VD: hơn 1 ngày)
    2. Không phải là kỷ lục public / private
    3. Không phải là bài nộp mới nhất của team
    """

    def __init__(
        self,
        submission_repo: ISubmissionRepository,
        storage_repo: IStorageRepository | None,
    ):
        self.submission_repo = submission_repo
        self.storage_repo = storage_repo

    def execute(self, older_than: datetime) -> int:
        stale_subs = self.submission_repo.get_stale_submissions(older_than=older_than)
        if not stale_subs:
            logger.info("Storage Cleanup: No stale files found to clean.")
            return 0
            
        deleted_ids = []
        for sub in stale_subs:
            if not sub.file_url:
                continue
            try:
                if self.storage_repo:
                    self.storage_repo.delete(sub.file_url)
                else:
                    logger.info("Storage_repo not configured, skipping S3 delete for file: %s", sub.file_url)
                deleted_ids.append(sub.id)
            except Exception as e:
                logger.error("Failed to delete file %s from S3: %s", sub.file_url, e)
                
        if deleted_ids:
            self.submission_repo.nullify_file_urls(deleted_ids)
            logger.info("Storage Cleanup: nullified file_urls for %d submissions.", len(deleted_ids))
            
        return len(deleted_ids)
