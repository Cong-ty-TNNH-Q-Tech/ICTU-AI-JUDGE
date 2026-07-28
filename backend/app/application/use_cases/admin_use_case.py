import csv
import io
import uuid

from fastapi import HTTPException, status
from app.adapters.database.challenge_repository import SQLChallengeRepository
from app.adapters.database.submission_repository import SQLSubmissionRepository
from app.adapters.database.user_repository import UserRepository
from app.application.dtos.admin_dtos import UserDTO, UserListResponseDTO
from app.application.dtos.submission_dtos import SubmissionListResponseDTO, SubmissionResponseDTO
from app.application.interfaces.repositories import ILeaderboardRepository
from app.domain.entities.entities import ChallengeType


class AdminUseCase:
    def __init__(
        self,
        user_repo: UserRepository,
        challenge_repo: SQLChallengeRepository,
        submission_repo: SQLSubmissionRepository,
        leaderboard_repo: ILeaderboardRepository,
    ):
        self.user_repo = user_repo
        self.challenge_repo = challenge_repo
        self.submission_repo = submission_repo
        self.leaderboard_repo = leaderboard_repo

    def list_users(self, q: str, page: int, size: int) -> UserListResponseDTO:
        users, total = self.user_repo.list_all(query=q, page=page, size=size)
        return UserListResponseDTO(
            items=[UserDTO.model_validate(u) for u in users],
            total=total,
            page=page,
            size=size
        )

    def update_user_status(self, user_id: uuid.UUID, is_active: bool) -> dict:
        success = self.user_repo.update_status(user_id=user_id, is_active=is_active)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy user với id {user_id}"
            )
        return {"detail": "Cập nhật trạng thái thành công"}

    def get_whitelist(self, challenge_id: uuid.UUID, page: int, size: int) -> dict:
        challenge = self.challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài thi")
            
        participants, total = self.challenge_repo.list_participants(challenge_id, page, size)
        
        return {
            "data": participants,
            "total": total,
            "page": page,
            "size": size
        }

    def add_whitelist(self, challenge_id: uuid.UUID, user_ids: list[uuid.UUID]) -> dict:
        challenge = self.challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài thi")
            
        if challenge.type != ChallengeType.COMPETITION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tính năng whitelist chỉ áp dụng cho loại bài thi COMPETITION"
            )
            
        added_count = self.challenge_repo.add_participants(challenge_id, user_ids)
        return {"detail": f"Đã thêm {added_count} sinh viên vào whitelist thành công"}

    def list_all_submissions(self, challenge_id: uuid.UUID, page: int, size: int) -> SubmissionListResponseDTO:
        challenge = self.challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài thi")
            
        entities, total = self.submission_repo.list_all_by_challenge(challenge_id, page, size)
        dtos = [SubmissionResponseDTO.model_validate(e) for e in entities]
        return SubmissionListResponseDTO(
            data=dtos,
            total_count=total,
            page=page,
            size=size
        )

    def export_leaderboard_csv(self, challenge_id: uuid.UUID, leaderboard_type: str) -> tuple[str, str]:
        challenge = self.challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài thi")

        data = self.leaderboard_repo.export_all(
            challenge_id=challenge_id,
            direction=challenge.metric_direction,
            leaderboard_type=leaderboard_type,
        )

        output = io.StringIO()
        output.write("\ufeff")
        fieldnames = [
            "Rank", "Team Name", "MSSV", "Full Name",
            "Public Score", "Private Score", "Last Submission Time",
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

        filename = f"leaderboard_{challenge_id}_{leaderboard_type}.csv"
        return output.getvalue(), filename
