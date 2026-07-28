"""
ProfileUseCase — Issue #30: Hồ sơ cá nhân (View & Update Profile).
Business logic: xem profile, cập nhật Github/LinkedIn, upload Avatar, xem solutions list.
[ARCH] Tuân thủ Hexagonal Architecture:
  - Không import FastAPI / SQLAlchemy trực tiếp.
  - Gọi self._uow.commit() để quản lý transaction, KHÔNG để Router làm việc này.
[SECURITY] Avatar upload: validate format + size trước khi upload lên MinIO.
"""
import logging
import uuid

from app.application.dtos.profile_dtos import (
    AvatarUploadResponseDTO,
    UpdateProfileRequest,
    UserProfileDTO,
    UserSolutionDTO,
)
from app.application.interfaces.repositories import (
    IStorageRepository,
    ISolutionRepository,
    IUnitOfWork,
    IUserRepository,
)
from app.domain.entities.entities import UserEntity

logger = logging.getLogger(__name__)

# Danh sách MIME type được phép cho avatar
ALLOWED_AVATAR_MIME = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_AVATAR_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024  # 2MB


class ProfileUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        storage_repo: IStorageRepository,
        solution_repo: ISolutionRepository,
        uow: IUnitOfWork,
    ):
        self._user_repo = user_repo
        self._storage_repo = storage_repo
        self._solution_repo = solution_repo
        self._uow = uow

    # ==========================================
    # Private helpers
    # ==========================================

    def _generate_avatar_url(self, s3_key: str | None) -> str | None:
        """Generate presigned URL on-the-fly từ S3 key. Trả None nếu key None."""
        if not s3_key:
            return None
        try:
            return self._storage_repo.get_download_url(s3_key)
        except Exception:
            logger.warning("Failed to generate presigned URL for avatar key=%s", s3_key)
            return None

    def _build_profile_dto(self, user: UserEntity) -> UserProfileDTO:
        """Build UserProfileDTO từ entity + fetch stats từ repo."""
        stats = self._user_repo.get_profile_stats(user.id)
        return UserProfileDTO(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            github_url=user.github_url,
            linkedin_url=user.linkedin_url,
            avatar_url=self._generate_avatar_url(user.avatar_url),
            total_submissions=stats["total_submissions"],
            total_solutions=stats["total_solutions"],
            best_rank=stats["best_rank"],
        )

    # ==========================================
    # Public Use Case methods
    # ==========================================

    def get_profile(self, user_id: uuid.UUID) -> UserProfileDTO:
        """
        Lấy hồ sơ công khai của user kèm stats tổng hợp.
        Raises LookupError nếu user không tồn tại.
        """
        user = self._user_repo.get_by_id(user_id)
        if not user:
            raise LookupError(f"User {user_id} không tồn tại.")
        return self._build_profile_dto(user)

    def update_profile(
        self,
        current_user: UserEntity,
        payload: UpdateProfileRequest,
    ) -> UserProfileDTO:
        """
        Cập nhật Github URL và LinkedIn URL của user hiện tại.
        [ARCH] Gọi self._uow.commit() để hoàn tất transaction — Router không được commit.
        """
        updated = self._user_repo.update_profile(
            user_id=current_user.id,
            github_url=payload.github_url,
            linkedin_url=payload.linkedin_url,
        )
        if not updated:
            raise LookupError("Không tìm thấy user để cập nhật.")
        self._uow.commit()
        logger.info(
            "Profile updated: user=%s github=%s linkedin=%s",
            current_user.id, payload.github_url, payload.linkedin_url,
        )
        return self._build_profile_dto(updated)

    def upload_avatar(
        self,
        current_user: UserEntity,
        file_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> AvatarUploadResponseDTO:
        """
        Upload ảnh đại diện lên MinIO và cập nhật avatar_url trong DB.
        [SECURITY] Validate format (jpg/png/webp) và size (max 2MB) trước khi upload.
        [ARCH] Gọi self._uow.commit() để hoàn tất transaction — Router không được commit.
        Trả về presigned URL để Frontend hiển thị ngay (cập nhật Zustand store).
        """
        # 1. Validate size
        if len(file_bytes) > MAX_AVATAR_SIZE_BYTES:
            raise ValueError(
                f"Ảnh quá lớn. Giới hạn {MAX_AVATAR_SIZE_BYTES // (1024 * 1024)}MB, "
                f"nhận được {len(file_bytes) / (1024 * 1024):.1f}MB."
            )

        # 2. Validate format qua extension + MIME
        ext = ""
        if "." in filename:
            ext = "." + filename.rsplit(".", 1)[-1].lower()

        if ext not in ALLOWED_AVATAR_EXTENSIONS or content_type not in ALLOWED_AVATAR_MIME:
            raise ValueError(
                f"Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WebP. "
                f"Nhận được: {filename} ({content_type})"
            )

        # 3. Build S3 key có user_id prefix để dễ quản lý
        s3_key = f"avatars/{current_user.id}/{filename}"
        logger.info("Uploading avatar: user=%s key=%s size=%d", current_user.id, s3_key, len(file_bytes))

        # 4. Upload lên MinIO
        self._storage_repo.upload(s3_key, file_bytes, content_type=content_type)

        # 5. Cập nhật DB (chỉ avatar_url — atomic UPDATE)
        self._user_repo.update_avatar(current_user.id, s3_key)

        # 6. Commit transaction — UseCase chịu trách nhiệm, không để Router làm
        self._uow.commit()
        logger.info("Avatar DB updated + committed: user=%s s3_key=%s", current_user.id, s3_key)

        # 7. Trả về presigned URL để Frontend cập nhật Zustand store ngay lập tức
        presigned_url = self._storage_repo.get_download_url(s3_key)
        return AvatarUploadResponseDTO(avatar_url=presigned_url)

    def get_user_solutions(self, user_id: uuid.UUID) -> list[UserSolutionDTO]:
        """
        Lấy danh sách Solutions đã đăng của user kèm challenge_title.
        [ARCH] Dùng ISolutionRepository.list_by_user() — không inject db/Session trực tiếp.
        """
        rows = self._solution_repo.list_by_user(user_id)
        return [UserSolutionDTO(**row) for row in rows]
