import uuid
import datetime
import logging

from app.application.interfaces.repositories import IStorageRepository, ISolutionRepository, IChallengeRepository
from app.domain.entities.entities import SolutionEntity, UserEntity

logger = logging.getLogger(__name__)

class SolutionUseCase:
    def __init__(
        self,
        solution_repo: ISolutionRepository,
        storage_repo: IStorageRepository,
        challenge_repo: IChallengeRepository,
    ):
        self._solution_repo = solution_repo
        self._storage_repo = storage_repo
        self._challenge_repo = challenge_repo

    def get_solutions_for_challenge(self, challenge_id: uuid.UUID) -> list[SolutionEntity]:
        """Lấy danh sách solutions của một challenge."""
        challenge = self._challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise ValueError(f"Challenge {challenge_id} không tồn tại.")
        return self._solution_repo.list_by_challenge(challenge_id)

    def publish_solution(
        self,
        user: UserEntity,
        challenge_id: uuid.UUID,
        title: str,
        content: str,
        file_bytes: bytes,
        filename: str,
    ) -> SolutionEntity:
        """Upload notebook và lưu thông tin solution vào DB."""
        # 1. Validate challenge tồn tại và đang PUBLISHED
        from app.domain.entities.entities import ChallengeStatus
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
        logger.info(f"Uploading solution notebook to {s3_key}")
        self._storage_repo.upload(s3_key, file_bytes, content_type="application/x-ipynb+json")

        # 4. Lưu S3 key vào DB — KHÔNG lưu presigned URL (có TTL, sẽ expire)
        # Presigned URL sẽ được generate on-the-fly khi list_solutions trả về
        solution = SolutionEntity(
            id=uuid.uuid4(),
            challenge_id=challenge_id,
            user_id=user.id,
            title=title,
            content=content,
            notebook_url=s3_key,   # lưu S3 key, không lưu URL
            upvotes=0,
            created_at=datetime.datetime.now(datetime.timezone.utc),
        )

        saved = self._solution_repo.save(solution)
        logger.info(f"Solution published successfully: {saved.id}")
        return saved

