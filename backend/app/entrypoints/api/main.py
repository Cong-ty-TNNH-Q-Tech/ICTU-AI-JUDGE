"""
FastAPI Main Application — Entrypoint.
Đăng ký routers, middleware, exception handlers.
"""
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.domain.exceptions.exceptions import (
    AuthenticationError,
    DomainException,
    DuplicateSubmissionError,
    FileSizeExceededError,
    MetricLockedError,
    NotFoundError,
    PermissionDeniedError,
    RateLimitExceededError,
    SubmissionDeadlinePassedError,
    TeamAlreadyLockedError,
    TeamFullError,
    TeamHasSubmissionsError,
    UserAlreadyInTeamError,
    InvalidTokenError,
    InvalidPasswordError,
)

# ---- Routers (sẽ được implement bởi từng thành viên) ----
from app.entrypoints.api.v1 import (
    auth_router,
    challenges_router,
    leaderboard_router,
    submissions_router,
    teams_router,
    users_router,
    admin_router,
    tags_router,
    storage_router,
    contests_router,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="ICTU AI Challenge Platform — Hexagonal Architecture",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
)

# ==========================================
# CORS Middleware
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,        # Quan trọng: cho phép gửi HttpOnly Cookie
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Exception Handlers — Map Domain Exception → HTTP Code
# ==========================================

@app.exception_handler(AuthenticationError)
async def auth_error_handler(request: Request, exc: AuthenticationError):
    return JSONResponse(status_code=401, content={"detail": str(exc)})


@app.exception_handler(PermissionDeniedError)
async def permission_error_handler(request: Request, exc: PermissionDeniedError):
    return JSONResponse(status_code=403, content={"detail": str(exc)})


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(RateLimitExceededError)
async def rate_limit_handler(request: Request, exc: RateLimitExceededError):
    return JSONResponse(
        status_code=429,
        content={"detail": str(exc), "wait_minutes": exc.wait_minutes},
    )


@app.exception_handler(DuplicateSubmissionError)
async def duplicate_handler(request: Request, exc: DuplicateSubmissionError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(FileSizeExceededError)
async def file_size_handler(request: Request, exc: FileSizeExceededError):
    return JSONResponse(
        status_code=413,
        content={"detail": str(exc), "max_mb": exc.max_mb},
    )


@app.exception_handler(InvalidTokenError)
async def invalid_token_handler(request: Request, exc: InvalidTokenError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(InvalidPasswordError)
async def invalid_password_handler(request: Request, exc: InvalidPasswordError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(SubmissionDeadlinePassedError)
async def deadline_handler(request: Request, exc: SubmissionDeadlinePassedError):
    return JSONResponse(status_code=403, content={"detail": str(exc)})


@app.exception_handler(MetricLockedError)
async def metric_locked_handler(request: Request, exc: MetricLockedError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Bắt mọi ValueError chưa được xử lý — trả về 400 thay vì 500 (thiếu CORS headers)."""
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(TeamAlreadyLockedError)
@app.exception_handler(TeamHasSubmissionsError)
@app.exception_handler(TeamFullError)
@app.exception_handler(UserAlreadyInTeamError)
async def team_error_handler(request: Request, exc: DomainException):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(DomainException)
async def generic_domain_handler(request: Request, exc: DomainException):
    logger.warning("Unhandled domain exception: %s", exc)
    return JSONResponse(status_code=400, content={"detail": str(exc)})


# ==========================================
# Register Routers
# ==========================================
app.include_router(auth_router.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Auth"])
app.include_router(users_router.router, prefix=f"{settings.API_V1_PREFIX}/users", tags=["Users"])
app.include_router(contests_router.router, prefix=f"{settings.API_V1_PREFIX}/contests", tags=["Contests"])
app.include_router(challenges_router.router, prefix=f"{settings.API_V1_PREFIX}/challenges", tags=["Challenges"])
app.include_router(teams_router.router, prefix=f"{settings.API_V1_PREFIX}/teams", tags=["Teams"])
app.include_router(submissions_router.router, prefix=f"{settings.API_V1_PREFIX}/submissions", tags=["Submissions"])
app.include_router(leaderboard_router.router, prefix=f"{settings.API_V1_PREFIX}/challenges", tags=["Leaderboard"])
app.include_router(admin_router.router, prefix=f"{settings.API_V1_PREFIX}/admin", tags=["Admin"])
app.include_router(tags_router.router, prefix=f"{settings.API_V1_PREFIX}/tags", tags=["Tags"])
app.include_router(storage_router.router, prefix=f"{settings.API_V1_PREFIX}/storage", tags=["Storage"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME}
