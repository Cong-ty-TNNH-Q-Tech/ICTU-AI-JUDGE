import csv
import io
import uuid

from app.adapters.database.challenge_repository import SQLChallengeRepository
from app.adapters.database.submission_repository import SQLSubmissionRepository
from app.adapters.database.user_repository import UserRepository
from app.application.dtos.admin_dtos import UserDTO, UserListResponseDTO, UserCreateDTO, UserUpdateDTO, UserImportResultDTO
from app.application.dtos.submission_dtos import SubmissionListResponseDTO, SubmissionResponseDTO
from app.application.interfaces.repositories import ILeaderboardRepository, IUnitOfWork
from app.domain.entities.entities import ChallengeType, UserEntity, UserRole

from app.adapters.worker.scoring_tasks import _run_sandbox
from app.domain.exceptions.exceptions import NotFoundError, PermissionDeniedError
from app.core.security import hash_password
from datetime import datetime, timezone

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
            raise ValueError(str(e))

    def __init__(
        self,
        user_repo: UserRepository,
        challenge_repo: SQLChallengeRepository,
        submission_repo: SQLSubmissionRepository,
        leaderboard_repo: ILeaderboardRepository,
        uow: IUnitOfWork,
        root_admin_email: str | None = None,
    ):
        self.user_repo = user_repo
        self.challenge_repo = challenge_repo
        self.submission_repo = submission_repo
        self.leaderboard_repo = leaderboard_repo
        self.uow = uow
        self.root_admin_email = root_admin_email

    def list_users(self, q: str, page: int, size: int) -> UserListResponseDTO:
        users, total = self.user_repo.list_all_admin(query=q, page=page, size=size)
        return UserListResponseDTO(
            items=[UserDTO.model_validate(u) for u in users],
            total=total,
            page=page,
            size=size
        )

    def update_user_status(self, user_id: uuid.UUID, is_active: bool) -> dict:
        user = self.user_repo.get_by_id_admin(user_id)
        if not user:
            raise NotFoundError(f"Không tìm thấy user với id {user_id}")
            
        if self.root_admin_email and user.email == self.root_admin_email:
            raise PermissionDeniedError("Không thể thay đổi trạng thái của Root Admin")

        success = self.user_repo.update_status(user_id=user_id, is_active=is_active)
        if not success:
            raise NotFoundError(f"Không tìm thấy user với id {user_id}")
        return {"detail": "Cập nhật trạng thái thành công"}

    def update_user_role(self, user_id: uuid.UUID, role: str) -> dict:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("Không tìm thấy user hoặc user đã bị khóa")
            
        if self.root_admin_email and user.email == self.root_admin_email:
            raise PermissionDeniedError("Không thể thay đổi quyền của Root Admin")

        success = self.user_repo.update_role(user_id=user_id, role=role)
        if not success:
            raise NotFoundError("Không tìm thấy user hoặc user đã bị khóa")
        return {"detail": "Cập nhật quyền thành công"}

    def create_user(self, data: UserCreateDTO) -> UserDTO:
        if self.user_repo.get_by_email(data.email):
            raise ValueError(f"Email {data.email} đã tồn tại")
        if self.user_repo.get_by_student_id(data.student_id):
            raise ValueError(f"Mã sinh viên {data.student_id} đã tồn tại")

        user_password = data.password if data.password else data.student_id
        hashed_password = hash_password(user_password)

        new_user = UserEntity(
            id=uuid.uuid4(),
            email=data.email,
            student_id=data.student_id,
            full_name=data.full_name,
            role=data.role,
            password_hash=hashed_password,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        saved = self.user_repo.save(new_user)
        self.uow.commit()
        return UserDTO.model_validate(saved)

    def update_user(self, user_id: uuid.UUID, data: UserUpdateDTO) -> UserDTO:
        user = self.user_repo.get_by_id_admin(user_id)
        if not user:
            raise NotFoundError("Không tìm thấy user")

        if data.email and data.email != user.email:
            if self.user_repo.get_by_email(data.email):
                raise ValueError(f"Email {data.email} đã tồn tại")
            user.email = data.email
            
        if data.student_id and data.student_id != user.student_id:
            if self.user_repo.get_by_student_id(data.student_id):
                raise ValueError(f"Mã sinh viên {data.student_id} đã tồn tại")
            user.student_id = data.student_id

        if data.full_name:
            user.full_name = data.full_name
            
        if data.role:
            if self.root_admin_email and user.email == self.root_admin_email and data.role != UserRole.ADMIN:
                raise PermissionDeniedError("Không thể hạ quyền Root Admin")
            user.role = data.role
            
        if data.password:
            user.password_hash = hash_password(data.password)

        user.updated_at = datetime.now(timezone.utc)
        saved = self.user_repo.save(user)
        self.uow.commit()
        return UserDTO.model_validate(saved)

    def import_users_csv(self, file_content: bytes) -> UserImportResultDTO:
        content_str = file_content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(content_str))
        
        success_count = 0
        failed_count = 0
        errors = []
        
        for row in reader:
            student_id = row.get("student_id", "").strip()
            email = row.get("email", "").strip()
            full_name = row.get("full_name", "").strip()
            
            if not student_id or not email or not full_name:
                failed_count += 1
                errors.append(f"Dòng thiếu dữ liệu: {row}")
                continue
                
            if self.user_repo.get_by_email(email):
                failed_count += 1
                errors.append(f"Email {email} đã tồn tại")
                continue
                
            if self.user_repo.get_by_student_id(student_id):
                failed_count += 1
                errors.append(f"Mã SV {student_id} đã tồn tại")
                continue
                
            hashed_password = hash_password(student_id)
            new_user = UserEntity(
                id=uuid.uuid4(),
                email=email,
                student_id=student_id,
                full_name=full_name,
                role=UserRole.STUDENT,
                password_hash=hashed_password,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            self.user_repo.save(new_user)
            success_count += 1
            
        self.uow.commit()
        
        return UserImportResultDTO(
            total=success_count + failed_count,
            success=success_count,
            failed=failed_count,
            errors=errors
        )

    def get_whitelist(self, challenge_id: uuid.UUID, page: int, size: int) -> dict:
        challenge = self.challenge_repo.get_by_id(challenge_id)
        if not challenge:
            raise NotFoundError("Không tìm thấy bài thi")
            
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
            raise NotFoundError("Không tìm thấy bài thi")
            
        if challenge.type != ChallengeType.COMPETITION:
            raise ValueError("Tính năng whitelist chỉ áp dụng cho loại bài thi COMPETITION")
            
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
            raise NotFoundError("Không tìm thấy bài thi")

        if challenge.type != ChallengeType.COMPETITION:
            raise ValueError("Tính năng whitelist chỉ áp dụng cho loại bài thi COMPETITION")

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
            raise ValueError(f"Không tìm thấy user nào khớp với {len(identifiers)} identifier đã nhập.")

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
            raise NotFoundError("Không tìm thấy bài thi")
            
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
            raise NotFoundError("Không tìm thấy bài thi")

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
