import uuid
from unittest.mock import MagicMock
import pytest
from datetime import datetime

from app.application.use_cases.cleanup_use_case import CleanupStaleStorageUseCase

@pytest.fixture
def cleanup_use_case():
    submission_repo = MagicMock()
    storage_repo = MagicMock()
    return CleanupStaleStorageUseCase(submission_repo, storage_repo)

def test_cleanup_no_stale(cleanup_use_case):
    cleanup_use_case.submission_repo.get_stale_submissions.return_value = []
    res = cleanup_use_case.execute(datetime.now())
    assert res == 0

def test_cleanup_success(cleanup_use_case):
    sub = MagicMock()
    sub.id = uuid.uuid4()
    sub.file_url = "s3://bucket/key"
    
    cleanup_use_case.submission_repo.get_stale_submissions.return_value = [sub]
    
    res = cleanup_use_case.execute(datetime.now())
    assert res == 1
    cleanup_use_case.storage_repo.delete.assert_called_once_with("s3://bucket/key")
    cleanup_use_case.submission_repo.nullify_file_urls.assert_called_once_with([sub.id])

def test_cleanup_delete_fails(cleanup_use_case):
    sub = MagicMock()
    sub.id = uuid.uuid4()
    sub.file_url = "s3://bucket/key"
    
    cleanup_use_case.submission_repo.get_stale_submissions.return_value = [sub]
    cleanup_use_case.storage_repo.delete.side_effect = Exception("S3 error")
    
    res = cleanup_use_case.execute(datetime.now())
    assert res == 0
    cleanup_use_case.submission_repo.nullify_file_urls.assert_not_called()

def test_cleanup_skip_no_url(cleanup_use_case):
    sub = MagicMock()
    sub.id = uuid.uuid4()
    sub.file_url = None
    
    cleanup_use_case.submission_repo.get_stale_submissions.return_value = [sub]
    
    res = cleanup_use_case.execute(datetime.now())
    assert res == 0
    cleanup_use_case.storage_repo.delete.assert_not_called()
