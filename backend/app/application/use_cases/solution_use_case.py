"""
SolutionUseCase — UC: Kernels / Solutions (Feature #27).
Đóng gói toàn bộ business logic: publish, list, upvote solutions.
Router chỉ gọi Use Case — không chứa business logic.
"""
import uuid
import datetime
import logging

from app.application.interfaces.repositories import (
    IStorageRepository,
    ISolutionRepository,
    IChallengeRepository,
    IUserRepository,
)
from app.application.dtos.solution_dtos import SolutionListResponseDTO, SolutionResponseDTO
from app.domain.entities.entities import ChallengeStatus, SolutionEntity, UserEntity

logger = logging.getLogger(__name__)


class SolutionUseCase:
    def __init__(
        self,
        solution_repo: ISolutionRepository,
        storage_repo: IStorageRepository,
        challenge_repo: IChallengeRepository,
        user_repo: IUserRepository,
    ):
        self._solution_repo = solution_repo
        self._storage_repo = storage_repo
        self._challenge_repo = challenge_repo
        self._user_repo = user_repo

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _resolve_author_name(self, user_id: uuid.UUID) -> str:
        """Lấy tên hiển thị của tác giả — fallback về user_id nếu không tìm thấy."""
        user = self._user_repo.get_by_id(user_id)
        return user.full_name if user and user.full_name else str(user_id)

    def _build_download_url(self, s3_key: str, filename: str) -> str:
        """Generate download proxy URL on-the-fly — không bao giờ lưu URL vào DB."""
        try:
            return self._storage_repo.get_download_url(
                s3_key,
                filename=filename,
            )
        except Exception:
            logger.warning("Failed to generate download URL for key=%s — fallback to key", s3_key)
            return s3_key  # fallback nếu storage không khả dụng

    def _to_dto(self, entity: SolutionEntity) -> SolutionResponseDTO:
        """Chuyển SolutionEntity → SolutionResponseDTO với author_name và presigned URL."""
        filename = entity.notebook_url.split("/")[-1]
        return SolutionResponseDTO(
            id=entity.id,
            challenge_id=entity.challenge_id,
            user_id=entity.user_id,
            author_name=self._resolve_author_name(entity.user_id),
            title=entity.title,
            content=entity.content,
            notebook_url=self._build_download_url(entity.notebook_url, filename),
            upvotes=entity.upvotes,
            created_at=entity.created_at,
        )

    # ------------------------------------------------------------------
    # Public Use Case methods
    # ------------------------------------------------------------------

    def list_solutions(self, challenge_id: uuid.UUID) -> SolutionListResponseDTO:
        """Lấy danh sách solutions của một challenge, kèm author_name và presigned URL."""
        challenge = self._challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise ValueError(f"Challenge {challenge_id} không tồn tại.")
        entities = self._solution_repo.list_by_challenge(challenge_id)
        items = [self._to_dto(e) for e in entities]
        return SolutionListResponseDTO(items=items, total=len(items))

    def publish_solution(
        self,
        user: UserEntity,
        challenge_id: uuid.UUID,
        title: str,
        content: str,
        file_bytes: bytes,
        filename: str,
    ) -> SolutionResponseDTO:
        """Upload notebook và lưu thông tin solution vào DB. Trả về DTO đầy đủ."""
        # 1. Validate challenge tồn tại và đang PUBLISHED
        challenge = self._challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise ValueError(f"Challenge {challenge_id} không tồn tại.")
        if challenge.status != ChallengeStatus.PUBLISHED:
            raise ValueError("Chỉ có thể chia sẻ giải pháp trên các bài thi đang PUBLISHED.")

        # 2. Validate file .ipynb
        if not filename.endswith(".ipynb"):
            raise ValueError("Chỉ hỗ trợ file Jupyter Notebook (.ipynb)")

        # 3. Build S3 key và upload
        timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d%H%M%S")
        s3_key = f"solutions/{challenge_id}/{user.id}/{timestamp}_{filename}"
        logger.info("Uploading solution notebook to %s", s3_key)
        self._storage_repo.upload(s3_key, file_bytes, content_type="application/x-ipynb+json")

        # 4. Lưu S3 key vào DB — KHÔNG lưu presigned URL (có TTL, sẽ expire)
        solution = SolutionEntity(
            id=uuid.uuid4(),
            challenge_id=challenge_id,
            user_id=user.id,
            title=title,
            content=content,
            notebook_url=s3_key,  # lưu S3 key, không lưu URL
            upvotes=0,
            created_at=datetime.datetime.now(datetime.timezone.utc),
        )
        saved = self._solution_repo.save(solution)
        logger.info("Solution published successfully: %s", saved.id)

        # 5. Trả về DTO với presigned URL đã generate
        return SolutionResponseDTO(
            id=saved.id,
            challenge_id=saved.challenge_id,
            user_id=saved.user_id,
            author_name=user.full_name or str(user.id),
            title=saved.title,
            content=saved.content,
            notebook_url=self._build_presigned_url(saved.notebook_url, filename),
            upvotes=saved.upvotes,
            created_at=saved.created_at,
        )

    def upvote_solution(
        self,
        solution_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> SolutionResponseDTO:
        """
        Upvote solution (+1). Mỗi user chỉ vote được 1 lần.
        Raises ValueError nếu đã vote rồi.
        Raises LookupError nếu solution không tồn tại.
        """
        updated = self._solution_repo.upvote(solution_id, user_id)
        if not updated:
            raise LookupError(f"Solution {solution_id} không tồn tại.")
        return self._to_dto(updated)
