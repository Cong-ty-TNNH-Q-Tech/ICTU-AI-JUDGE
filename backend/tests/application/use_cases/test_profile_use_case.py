"""
Tests for ProfileUseCase — Issue #30: Hồ sơ cá nhân.
Coverage target: ≥90% of profile_use_case.py
"""
import datetime
import uuid
from unittest.mock import MagicMock

import pytest

from app.application.use_cases.profile_use_case import ProfileUseCase
from app.domain.entities.entities import UserEntity, UserRole


# ==========================================
# Helpers & Fixtures
# ==========================================

def _make_user(**kwargs) -> UserEntity:
    defaults = dict(
        id=uuid.uuid4(),
        email="test@ictu.edu.vn",
        student_id="dtc235210001",
        full_name="Nguyen Van A",
        role=UserRole.STUDENT,
        password_hash="hashed",
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now(),
        github_url=None,
        linkedin_url=None,
        avatar_url=None,
    )
    defaults.update(kwargs)
    return UserEntity(**defaults)


@pytest.fixture
def profile_use_case():
    user_repo = MagicMock()
    storage_repo = MagicMock()
    solution_repo = MagicMock()
    uow = MagicMock()
    return ProfileUseCase(user_repo, storage_repo, solution_repo, uow)


# ==========================================
# get_profile
# ==========================================

def test_get_profile_success(profile_use_case):
    user = _make_user()
    profile_use_case._user_repo.get_by_id.return_value = user
    profile_use_case._user_repo.get_profile_stats.return_value = {
        "total_submissions": 5,
        "total_solutions": 2,
        "best_rank": 1,
    }
    profile_use_case._storage_repo.get_presigned_url.return_value = None

    result = profile_use_case.get_profile(user.id)

    assert result.id == user.id
    assert result.email == user.email
    assert result.full_name == user.full_name
    assert result.total_submissions == 5
    assert result.total_solutions == 2
    assert result.best_rank == 1


def test_get_profile_with_avatar(profile_use_case):
    user = _make_user(avatar_url="avatars/uid/avatar.jpg")
    profile_use_case._user_repo.get_by_id.return_value = user
    profile_use_case._user_repo.get_profile_stats.return_value = {
        "total_submissions": 0,
        "total_solutions": 0,
        "best_rank": None,
    }
    profile_use_case._storage_repo.get_presigned_url.return_value = "http://minio/presigned"

    result = profile_use_case.get_profile(user.id)

    assert result.avatar_url == "http://minio/presigned"
    profile_use_case._storage_repo.get_presigned_url.assert_called_once_with(
        "avatars/uid/avatar.jpg", expires_in=3600
    )


def test_get_profile_not_found_raises(profile_use_case):
    profile_use_case._user_repo.get_by_id.return_value = None

    with pytest.raises(LookupError, match="không tồn tại"):
        profile_use_case.get_profile(uuid.uuid4())


def test_get_profile_avatar_presigned_url_failure_returns_none(profile_use_case):
    """Khi generate presigned URL thất bại → trả None, không crash."""
    user = _make_user(avatar_url="avatars/uid/avatar.jpg")
    profile_use_case._user_repo.get_by_id.return_value = user
    profile_use_case._user_repo.get_profile_stats.return_value = {
        "total_submissions": 0, "total_solutions": 0, "best_rank": None,
    }
    profile_use_case._storage_repo.get_presigned_url.side_effect = Exception("MinIO down")

    result = profile_use_case.get_profile(user.id)

    assert result.avatar_url is None  # graceful fallback


# ==========================================
# update_profile
# ==========================================

def test_update_profile_success(profile_use_case):
    from app.application.dtos.profile_dtos import UpdateProfileRequest
    user = _make_user()
    updated_user = _make_user(
        id=user.id,
        email=user.email,
        github_url="https://github.com/user",
        linkedin_url="https://linkedin.com/in/user",
    )
    profile_use_case._user_repo.update_profile.return_value = updated_user
    profile_use_case._user_repo.get_profile_stats.return_value = {
        "total_submissions": 0, "total_solutions": 0, "best_rank": None,
    }
    profile_use_case._storage_repo.get_presigned_url.return_value = None

    payload = UpdateProfileRequest(
        github_url="https://github.com/user",
        linkedin_url="https://linkedin.com/in/user",
    )
    result = profile_use_case.update_profile(user, payload)

    assert result.github_url == "https://github.com/user"
    assert result.linkedin_url == "https://linkedin.com/in/user"
    profile_use_case._uow.commit.assert_called_once()


def test_update_profile_user_not_found_raises(profile_use_case):
    from app.application.dtos.profile_dtos import UpdateProfileRequest
    user = _make_user()
    profile_use_case._user_repo.update_profile.return_value = None

    with pytest.raises(LookupError, match="(?i)không tìm thấy"):
        profile_use_case.update_profile(user, UpdateProfileRequest())


def test_update_profile_does_not_commit_on_failure(profile_use_case):
    from app.application.dtos.profile_dtos import UpdateProfileRequest
    user = _make_user()
    profile_use_case._user_repo.update_profile.return_value = None

    with pytest.raises(LookupError):
        profile_use_case.update_profile(user, UpdateProfileRequest())

    profile_use_case._uow.commit.assert_not_called()


# ==========================================
# upload_avatar
# ==========================================

VALID_JPEG = b"\xff\xd8\xff" + b"\x00" * 100  # fake JPEG bytes


def test_upload_avatar_success(profile_use_case):
    user = _make_user()
    profile_use_case._storage_repo.get_presigned_url.return_value = "http://minio/new-avatar"

    result = profile_use_case.upload_avatar(
        current_user=user,
        file_bytes=VALID_JPEG,
        filename="photo.jpg",
        content_type="image/jpeg",
    )

    assert result.avatar_url == "http://minio/new-avatar"
    profile_use_case._storage_repo.upload.assert_called_once()
    profile_use_case._user_repo.update_avatar.assert_called_once_with(
        user.id, f"avatars/{user.id}/photo.jpg"
    )
    profile_use_case._uow.commit.assert_called_once()


def test_upload_avatar_png_success(profile_use_case):
    user = _make_user()
    profile_use_case._storage_repo.get_presigned_url.return_value = "http://minio/png"

    result = profile_use_case.upload_avatar(
        current_user=user,
        file_bytes=b"\x89PNG" + b"\x00" * 50,
        filename="avatar.png",
        content_type="image/png",
    )

    assert result.avatar_url == "http://minio/png"
    profile_use_case._uow.commit.assert_called_once()


def test_upload_avatar_too_large_raises(profile_use_case):
    user = _make_user()
    oversized = b"\x00" * (3 * 1024 * 1024)  # 3MB > 2MB limit

    with pytest.raises(ValueError, match="quá lớn"):
        profile_use_case.upload_avatar(
            current_user=user,
            file_bytes=oversized,
            filename="big.jpg",
            content_type="image/jpeg",
        )

    profile_use_case._uow.commit.assert_not_called()


def test_upload_avatar_invalid_extension_raises(profile_use_case):
    user = _make_user()

    with pytest.raises(ValueError, match="JPG, PNG hoặc WebP"):
        profile_use_case.upload_avatar(
            current_user=user,
            file_bytes=b"pdf content",
            filename="doc.pdf",
            content_type="application/pdf",
        )

    profile_use_case._uow.commit.assert_not_called()


def test_upload_avatar_invalid_mime_raises(profile_use_case):
    """Extension ok nhưng MIME type sai → reject."""
    user = _make_user()

    with pytest.raises(ValueError, match="JPG, PNG hoặc WebP"):
        profile_use_case.upload_avatar(
            current_user=user,
            file_bytes=b"fake",
            filename="file.jpg",
            content_type="text/plain",
        )


def test_upload_avatar_webp_success(profile_use_case):
    user = _make_user()
    profile_use_case._storage_repo.get_presigned_url.return_value = "http://minio/webp"

    result = profile_use_case.upload_avatar(
        current_user=user,
        file_bytes=b"RIFF" + b"\x00" * 50,
        filename="avatar.webp",
        content_type="image/webp",
    )

    assert result.avatar_url == "http://minio/webp"


# ==========================================
# get_user_solutions
# ==========================================

def test_get_user_solutions_returns_list(profile_use_case):
    user_id = uuid.uuid4()
    challenge_id = uuid.uuid4()
    now = datetime.datetime.now()
    profile_use_case._solution_repo.list_by_user.return_value = [
        {
            "id": uuid.uuid4(),
            "challenge_id": challenge_id,
            "challenge_title": "AI Challenge 2026",
            "title": "Giải pháp ResNet50",
            "upvotes": 5,
            "created_at": now,
        }
    ]

    results = profile_use_case.get_user_solutions(user_id)

    assert len(results) == 1
    assert results[0].challenge_title == "AI Challenge 2026"
    assert results[0].title == "Giải pháp ResNet50"
    assert results[0].upvotes == 5
    profile_use_case._solution_repo.list_by_user.assert_called_once_with(user_id)


def test_get_user_solutions_empty(profile_use_case):
    profile_use_case._solution_repo.list_by_user.return_value = []

    results = profile_use_case.get_user_solutions(uuid.uuid4())

    assert results == []
