import csv
import io
import logging
import uuid
import random
from datetime import datetime, timezone

from app.application.dtos.challenge_dtos import (
    ChallengeCreateRequestDTO,
    ChallengeListResponseDTO,
    ChallengeResponseDTO,
    ChallengeUpdateRequestDTO,
)
from app.application.interfaces.repositories import IChallengeRepository, IStorageRepository, ITagRepository
from app.application.utils.file_validation import validate_zip_format, validate_zip_contains_ground_truth_csv
from app.domain.entities.entities import ChallengeEntity, ChallengeStatus
from app.application.dtos.tag_dtos import TagResponseDTO

logger = logging.getLogger(__name__)


class ChallengeUseCase:
    def __init__(
        self,
        challenge_repo: IChallengeRepository,
        storage_repo: IStorageRepository,
        tag_repo: ITagRepository,
    ):
        self.challenge_repo = challenge_repo
        self.storage_repo = storage_repo
        self.tag_repo = tag_repo

    def _to_dto(
        self, entity: ChallengeEntity, is_admin: bool = False
    ) -> ChallengeResponseDTO:
        dto = ChallengeResponseDTO(
            id=entity.id,
            title=entity.title,
            description=entity.description,
            type=entity.type,
            status=entity.status,
            start_time=entity.start_time,
            end_time=entity.end_time,
            rate_limit_minutes=entity.rate_limit_minutes,
            max_file_size_mb=entity.max_file_size_mb,
            metric_name=entity.metric_name,
            metric_direction=entity.metric_direction,
            created_by=entity.created_by,
            created_at=entity.created_at,
            dataset_url=entity.dataset_url,
            team_lock_deadline=entity.team_lock_deadline,
            max_team_size=entity.max_team_size,
            ground_truth_url=entity.ground_truth_url if is_admin else None,
            custom_metric_url=entity.custom_metric_url if is_admin else None,
            parent_id=entity.parent_id,
            tags=[TagResponseDTO.model_validate(t) for t in entity.tags]
        )
        return dto

    def create_challenge(
        self, admin_id: uuid.UUID, data: ChallengeCreateRequestDTO
    ) -> ChallengeResponseDTO:
        new_entity = ChallengeEntity(
            id=uuid.uuid4(),
            title=data.title,
            description=data.description,
            type=data.type,
            status=ChallengeStatus.DRAFT,
            start_time=data.start_time,
            end_time=data.end_time,
            rate_limit_minutes=data.rate_limit_minutes,
            max_file_size_mb=data.max_file_size_mb,
            metric_name=data.metric_name,
            metric_direction=data.metric_direction,
            created_by=admin_id,
            dataset_url=data.dataset_url or "",
            ground_truth_url="",
            custom_metric_url="",
            team_lock_deadline=data.team_lock_deadline,
            max_team_size=data.max_team_size,
            created_at=datetime.now(timezone.utc),
            parent_id=data.parent_id,
            tags=[]
        )
        
        if data.tag_ids:
            tags = self.tag_repo.get_by_ids(data.tag_ids)
            if len(tags) != len(data.tag_ids):
                raise ValueError("Một số tags không tồn tại.")
            new_entity.tags = tags

        saved = self.challenge_repo.save(new_entity)
        return self._to_dto(saved, is_admin=True)

    def update_challenge(
        self, challenge_id: uuid.UUID, data: ChallengeUpdateRequestDTO
    ) -> ChallengeResponseDTO:
        challenge = self.challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise ValueError(f"Bài thi không tồn tại.")

        # UC09-E3: Không cho sửa nếu đã có bài nộp thành công
        if self.challenge_repo.has_successful_submission(challenge_id):
            raise ValueError("Không thể sửa bài thi đã có sinh viên nộp bài thành công.")

        # Update fields
        update_data = data.dict(exclude_unset=True, exclude={"tag_ids"})
        for key, value in update_data.items():
            setattr(challenge, key, value)
            
        if data.tag_ids is not None:
            if not data.tag_ids:
                challenge.tags = []
            else:
                tags = self.tag_repo.get_by_ids(data.tag_ids)
                if len(tags) != len(data.tag_ids):
                    raise ValueError("Một số tags không tồn tại.")
                challenge.tags = tags

        updated = self.challenge_repo.update(challenge)
        return self._to_dto(updated, is_admin=True)

    def get_challenge(
        self, challenge_id: uuid.UUID, is_admin: bool = False
    ) -> ChallengeResponseDTO:
        challenge = self.challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise ValueError("Bài thi không tồn tại.")

        if not is_admin and challenge.status != ChallengeStatus.PUBLISHED:
            raise ValueError("Bài thi không tồn tại.")

        return self._to_dto(challenge, is_admin=is_admin)

    def list_challenges(
        self, page: int, size: int, status_filter: str | None = None, is_admin: bool = False, tag_id: uuid.UUID | None = None
    ) -> ChallengeListResponseDTO:
        if not is_admin:
            status_filter = ChallengeStatus.PUBLISHED.value

        entities, total = self.challenge_repo.list_all(
            page=page, size=size, status_filter=status_filter, tag_id=tag_id
        )
        dtos = [self._to_dto(c, is_admin=is_admin) for c in entities]
        return ChallengeListResponseDTO(items=dtos, total=total, page=page, size=size)

    def delete_challenge(self, challenge_id: uuid.UUID) -> None:
        self.challenge_repo.soft_delete(challenge_id)

    def upload_secrets(
        self,
        challenge_id: uuid.UUID,
        ground_truth_bytes: bytes,
        ground_truth_filename: str = "ground_truth.csv",
        metric_script_bytes: bytes | None = None,
        public_test_split_ratio: int = 30,
    ) -> ChallengeResponseDTO:
        challenge = self.challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise ValueError("Bài thi không tồn tại.")

        if self.challenge_repo.has_successful_submission(challenge_id):
            raise ValueError("Không thể đổi file chấm điểm do đã có người nộp thành công.")

        if not ground_truth_filename:
            ground_truth_filename = "ground_truth.csv"

        is_zip = ground_truth_filename.lower().endswith(".zip")

        if is_zip:
            # [SECURITY] Validate zip bomb + path traversal
            validate_zip_format(ground_truth_bytes, ground_truth_filename)
            # [REQUIRED] Zip must contain ground_truth.csv for Public/Private split
            validate_zip_contains_ground_truth_csv(ground_truth_bytes)
            # Upload nguyên zip lên S3
            gt_key = f"challenges/{challenge_id}/ground_truth.zip"
            self.storage_repo.upload(
                key=gt_key, data=ground_truth_bytes, content_type="application/zip"
            )
            challenge.ground_truth_url = gt_key
        else:
            # Validate ground_truth_bytes has 'Usage' column, if not, generate it
            try:
                content = ground_truth_bytes.decode("utf-8")
                reader = csv.reader(io.StringIO(content))
                rows = list(reader)

                if not rows:
                    raise ValueError("File CSV rỗng.")

                headers = rows[0]
                if "Usage" not in headers:
                    headers.append("Usage")
                    data_rows = rows[1:]

                    n_total = len(data_rows)
                    n_public = int(n_total * (public_test_split_ratio / 100))
                    n_private = n_total - n_public

                    usages = ["Public"] * n_public + ["Private"] * n_private
                    random.shuffle(usages)

                    for row, usage in zip(data_rows, usages):
                        row.append(usage)

                    out_stream = io.StringIO()
                    writer = csv.writer(out_stream)
                    writer.writerow(headers)
                    writer.writerows(data_rows)
                    ground_truth_bytes = out_stream.getvalue().encode("utf-8")
            except ValueError as e:
                raise e
            except Exception as e:
                raise ValueError(f"Không thể đọc file CSV: {e}")

            # Upload Ground Truth CSV
            gt_key = f"challenges/{challenge_id}/ground_truth.csv"
            self.storage_repo.upload(key=gt_key, data=ground_truth_bytes)
            challenge.ground_truth_url = gt_key

        # Upload Metric Script if provided
        if metric_script_bytes:
            metric_key = f"challenges/{challenge_id}/metric.py"
            self.storage_repo.upload(
                key=metric_key, data=metric_script_bytes, content_type="text/x-python"
            )
            challenge.custom_metric_url = metric_key

        updated = self.challenge_repo.update(challenge)
        return self._to_dto(updated, is_admin=True)
