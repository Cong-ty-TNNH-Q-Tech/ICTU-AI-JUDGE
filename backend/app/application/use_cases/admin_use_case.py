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

from app.adapters.worker.scoring_tasks import _run_sandbox

class AdminUseCase:
    def test_metric(
        self,
        ground_truth: bytes,
        submission: bytes,
        metric_script: bytes | None,
        metric_name: str,
    ) -> float:
        try:
            score = _run_sandbox(
                submission_csv=submission,
                ground_truth_csv=ground_truth,
                metric_script=metric_script,
                metric_name=metric_name,
            )
            return score
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def __init__(
        self,
        user_repo: UserRepository,
        challenge_repo: SQLChallengeRepository,
        submission_repo: SQLSubmissionRepository,
        leaderboard_repo: ILeaderboardRepository,
        root_admin_email: str | None = None,
    ):
        self.user_repo = user_repo
        self.challenge_repo = challenge_repo
        self.submission_repo = submission_repo
        self.leaderboard_repo = leaderboard_repo
        self.root_admin_email = root_admin_email

    def list_users(self, q: str, page: int, size: int) -> UserListResponseDTO:
        users, total = self.user_repo.list_all(query=q, page=page, size=size)
        return UserListResponseDTO(
            items=[UserDTO.model_validate(u) for u in users],
            total=total,
            page=page,
            size=size
        )

    def update_user_status(self, user_id: uuid.UUID, is_active: bool) -> dict:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy user với id {user_id}"
            )
            
        if self.root_admin_email and user.email == self.root_admin_email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Không thể thay đổi trạng thái của Root Admin"
            )

        success = self.user_repo.update_status(user_id=user_id, is_active=is_active)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy user với id {user_id}"
            )
        return {"detail": "Cập nhật trạng thái thành công"}

    def update_user_role(self, user_id: uuid.UUID, role: str) -> dict:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy user hoặc user đã bị khóa"
            )
            
        if self.root_admin_email and user.email == self.root_admin_email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Không thể thay đổi quyền của Root Admin"
            )

        success = self.user_repo.update_role(user_id=user_id, role=role)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy user hoặc user đã bị khóa"
            )
        return {"detail": "Cập nhật quyền thành công"}

    def get_whitelist(self, challenge_id: uuid.UUID, page: int, size: int) -> dict:
        challenge = self.challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài thi")
            
        participants, total = self.challenge_repo.list_participants(challenge_id, page, size)
        
        return {
            "items": participants,
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

    def add_whitelist_by_identifiers(
        self, challenge_id: uuid.UUID, identifiers: list[str]
    ) -> dict:
        """
        UC10 — Thêm sinh viên vào Whitelist bằng Email / MSSV / UUID (Issue #91).
        Backend tự tra cứu user_id từ các định danh được cung cấp.
        Trả về báo cáo: số lượng tìm thấy, thêm thành công, và các identifier không tìm thấy.
        """
        challenge = self.challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài thi")

        if challenge.type != ChallengeType.COMPETITION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tính năng whitelist chỉ áp dụng cho loại bài thi COMPETITION",
            )

        # Resolve identifiers → UserEntity list
        resolved_users = self.user_repo.find_by_identifiers(identifiers)
        resolved_ids = [u.id for u in resolved_users]

        # Tìm identifier nào không resolve được
        resolved_raw = set()
        for u in resolved_users:
            if u.email:
                resolved_raw.add(u.email.lower())
            if u.student_id:
                resolved_raw.add(u.student_id.lower())
            resolved_raw.add(str(u.id).lower())

        not_found = [i for i in identifiers if i.strip().lower() not in resolved_raw]

        if not resolved_ids:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Không tìm thấy user nào khớp với {len(identifiers)} identifier đã nhập.",
            )

        added_count = self.challenge_repo.add_participants(challenge_id, resolved_ids)
        return {
            "added": added_count,
            "resolved": len(resolved_ids),
            "not_found": not_found,
            "detail": (
                f"Đã thêm {added_count} thí sinh vào Whitelist."
                + (f" {len(not_found)} identifier không tìm thấy." if not_found else "")
            ),
        }

    def list_all_submissions(self, challenge_id: uuid.UUID, page: int, size: int) -> SubmissionListResponseDTO:
        challenge = self.challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài thi")
            
        entities, total = self.submission_repo.list_all_by_challenge(challenge_id, page, size)
        dtos = [SubmissionResponseDTO.model_validate(e) for e in entities]
        return SubmissionListResponseDTO(
            items=dtos,
            total=total,
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
