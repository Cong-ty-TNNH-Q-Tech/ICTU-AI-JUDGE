"""
FastAPI Dependency Injection — Inbound layer.
Inject DB session, Settings và current_user vào Use Cases qua Depends.
"""
import uuid
from collections.abc import Generator

import jwt
from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import SessionLocal
from app.application.interfaces.repositories import (
    IUserRepository,
    ISolutionRepository,
    IStorageRepository,
    IChallengeRepository,
    ISubmissionRepository,
    ITeamRepository,
    IUnitOfWork,
    ITagRepository,
    ILeaderboardRepository,
    IContestRepository,
)
from app.adapters.database.user_repository import UserRepository
from app.adapters.database.solution_repository import PostgresSolutionRepository
from app.adapters.database.challenge_repository import SQLChallengeRepository
from app.adapters.database.submission_repository import SQLSubmissionRepository
from app.adapters.database.team_repository import SQLTeamRepository
from app.adapters.database.tag_repository import SQLTagRepository
from app.adapters.database.leaderboard_repository import SQLLeaderboardRepository
from app.adapters.database.contest_repository import SQLContestRepository
from app.core.database import SQLUnitOfWork
from app.adapters.storage.s3_repository import S3StorageRepository
from app.application.interfaces.message_broker import IMessageBroker
from app.adapters.message_broker.celery_adapter import CeleryMessageBroker
from app.application.interfaces.clients import IGoogleAuthClient
from app.adapters.clients.google_auth_client import GoogleAuthClient
from app.application.use_cases.solution_use_case import SolutionUseCase
from app.application.use_cases.profile_use_case import ProfileUseCase
from app.application.use_cases.submission_use_case import SubmissionUseCase
from app.application.use_cases.challenge_use_case import ChallengeUseCase
from app.application.use_cases.team_use_case import TeamUseCase
from app.application.use_cases.admin_use_case import AdminUseCase
from app.application.use_cases.tag_use_case import TagUseCase
from app.application.use_cases.auth_use_case import AuthUseCase
from app.application.use_cases.contest_use_case import ContestUseCase
from app.domain.entities.entities import UserEntity, UserRole

settings = get_settings()


def get_db() -> Generator[Session, None, None]:
    """
    Yield một DB session và tự động đóng sau khi request kết thúc.
    Dùng trong mọi Router: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_settings_dep() -> Settings:
    """Alias để inject Settings qua Depends trong Router."""
    return get_settings()


def get_current_user_id(
    access_token: str | None = Cookie(default=None, alias="access_token"),
) -> uuid.UUID:
    """
    Dependency: đọc JWT từ HttpOnly Cookie 'access_token'.
    Trả về user_id (UUID) đã được verify.
    Raises HTTP 401 nếu token thiếu hoặc không hợp lệ.
    """
    from app.core.security import decode_access_token
    from app.domain.exceptions.exceptions import AuthenticationError
    
    if not access_token:
        raise AuthenticationError("Chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.")
    
    payload = decode_access_token(access_token)
    user_id_str: str | None = payload.get("sub")
    if not user_id_str:
        raise AuthenticationError("Token không hợp lệ: thiếu subject.")
    return uuid.UUID(user_id_str)


def get_user_repository(db: Session = Depends(get_db)) -> IUserRepository:
    """Dependency: inject UserRepository."""
    return UserRepository(db)


def get_optional_current_user_id(
    access_token: str | None = Cookie(default=None, alias="access_token"),
) -> uuid.UUID | None:
    """
    Dependency: đọc JWT từ cookie nhưng trả None thay vì 401 khi không có token.
    Dùng cho Public endpoints cần optional auth context (VD: list challenges).
    """
    from app.core.security import decode_access_token
    from app.domain.exceptions.exceptions import AuthenticationError
    
    if not access_token:
        return None
    try:
        payload = decode_access_token(access_token)
        user_id_str: str | None = payload.get("sub")
        if not user_id_str:
            return None
        return uuid.UUID(user_id_str)
    except (AuthenticationError, ValueError):
        return None


def get_google_auth_client() -> IGoogleAuthClient:
    """Dependency: inject GoogleAuthClient."""
    return GoogleAuthClient()


def get_current_user(
    user_id: uuid.UUID = Depends(get_current_user_id),
    user_repo: IUserRepository = Depends(get_user_repository),
) -> UserEntity:
    """
    Dependency: lấy UserEntity đầy đủ từ DB dựa trên token.
    Raises 401 nếu user không tồn tại hoặc đã bị xóa.
    """
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Người dùng không tồn tại hoặc đã bị khóa.",
        )
    return user





def require_admin(user: UserEntity = Depends(get_current_user)) -> UserEntity:
    """
    Dependency: kiểm tra quyền ADMIN.
    Raises 403 nếu không phải ADMIN.
    """
    if not user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền thực hiện thao tác này.",
        )
    return user


# Re-export kiểu để Router dùng làm type hint
DBSession = Session


def get_solution_repository(db: Session = Depends(get_db)) -> ISolutionRepository:
    return PostgresSolutionRepository(db)


def get_storage_repository() -> IStorageRepository:
    return S3StorageRepository()


def get_challenge_repository(db: Session = Depends(get_db)) -> IChallengeRepository:
    return SQLChallengeRepository(db)


def get_submission_repository(db: Session = Depends(get_db)) -> ISubmissionRepository:
    return SQLSubmissionRepository(db)


def get_team_repository(db: Session = Depends(get_db)) -> ITeamRepository:
    return SQLTeamRepository(db)


def get_tag_repository(db: Session = Depends(get_db)) -> ITagRepository:
    return SQLTagRepository(db)

def get_uow(db: Session = Depends(get_db)) -> IUnitOfWork:
    return SQLUnitOfWork(db)


def get_leaderboard_repository(db: Session = Depends(get_db)) -> ILeaderboardRepository:
    return SQLLeaderboardRepository(db)


def get_contest_repository(db: Session = Depends(get_db)) -> IContestRepository:
    return SQLContestRepository(db)


def get_message_broker() -> IMessageBroker:
    return CeleryMessageBroker()


def get_solution_use_case(
    solution_repo: ISolutionRepository = Depends(get_solution_repository),
    storage_repo: IStorageRepository = Depends(get_storage_repository),
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
    user_repo: IUserRepository = Depends(get_user_repository),
) -> SolutionUseCase:
    return SolutionUseCase(solution_repo, storage_repo, challenge_repo, user_repo)


def get_profile_use_case(
    user_repo: IUserRepository = Depends(get_user_repository),
    storage_repo: IStorageRepository = Depends(get_storage_repository),
    solution_repo: ISolutionRepository = Depends(get_solution_repository),
    uow: IUnitOfWork = Depends(get_uow),
) -> ProfileUseCase:
    """Dependency: inject ProfileUseCase cho 3 endpoints profile."""
    return ProfileUseCase(user_repo, storage_repo, solution_repo, uow)


def get_submission_use_case(
    submission_repo: ISubmissionRepository = Depends(get_submission_repository),
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
    team_repo: ITeamRepository = Depends(get_team_repository),
    storage_repo: IStorageRepository = Depends(get_storage_repository),
    leaderboard_repo: ILeaderboardRepository = Depends(get_leaderboard_repository),
    message_broker: IMessageBroker = Depends(get_message_broker),
    uow: IUnitOfWork = Depends(get_uow),
) -> SubmissionUseCase:
    return SubmissionUseCase(
        submission_repo, challenge_repo, team_repo,
        storage_repo, leaderboard_repo, message_broker, uow
    )


def get_challenge_use_case(
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
    storage_repo: IStorageRepository = Depends(get_storage_repository),
    tag_repo: ITagRepository = Depends(get_tag_repository),
) -> ChallengeUseCase:
    return ChallengeUseCase(challenge_repo, storage_repo, tag_repo)


def get_admin_use_case(
    user_repo: IUserRepository = Depends(get_user_repository),
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
    submission_repo: ISubmissionRepository = Depends(get_submission_repository),
    leaderboard_repo: ILeaderboardRepository = Depends(get_leaderboard_repository),
    settings: Settings = Depends(get_settings_dep),
) -> AdminUseCase:
    return AdminUseCase(
        user_repo=user_repo,
        challenge_repo=challenge_repo,
        submission_repo=submission_repo,
        leaderboard_repo=leaderboard_repo,
        root_admin_email=settings.ROOT_ADMIN_EMAIL,
    )


def get_team_use_case(
    team_repo: ITeamRepository = Depends(get_team_repository),
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
    user_repo: IUserRepository = Depends(get_user_repository),
    uow: IUnitOfWork = Depends(get_uow),
) -> TeamUseCase:
    return TeamUseCase(team_repo, challenge_repo, user_repo, uow)

def get_tag_use_case(
    tag_repo: ITagRepository = Depends(get_tag_repository),
    uow: IUnitOfWork = Depends(get_uow)
) -> TagUseCase:
    return TagUseCase(uow, tag_repo)

def get_auth_use_case(
    user_repo: IUserRepository = Depends(get_user_repository),
    google_client: IGoogleAuthClient = Depends(get_google_auth_client),
) -> AuthUseCase:
    """
    Factory inject AuthUseCase với root_admin_email từ Settings.
    Entrypoint layer chịu trách nhiệm đọc config và truyền vào Use Case
    (tuân thủ Hexagonal Architecture — Use Case không import get_settings).
    """
    return AuthUseCase(
        user_repo=user_repo,
        google_client=google_client,
        root_admin_email=settings.ROOT_ADMIN_EMAIL,
    )

get_current_admin = require_admin

from app.application.use_cases.leaderboard_use_case import LeaderboardUseCase

def get_leaderboard_use_case(
    leaderboard_repo: ILeaderboardRepository = Depends(get_leaderboard_repository),
    challenge_repo: IChallengeRepository = Depends(get_challenge_repository),
) -> LeaderboardUseCase:
    return LeaderboardUseCase(leaderboard_repo, challenge_repo)


def get_contest_use_case(
    contest_repo: IContestRepository = Depends(get_contest_repository),
    uow: IUnitOfWork = Depends(get_uow),
) -> ContestUseCase:
    return ContestUseCase(contest_repo, uow)
