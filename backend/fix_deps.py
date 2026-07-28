import re

with open('app/entrypoints/dependencies.py', 'r') as f:
    content = f.read()

# Replace get_current_user_id
content = re.sub(
    r'def get_current_user_id\([\s\S]*?except \(jwt\.InvalidTokenError, ValueError\):[\s\S]*?detail="Token không hợp lệ\.",\s*\)',
    '''def get_current_user_id(
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
    return uuid.UUID(user_id_str)''',
    content
)

# Replace get_optional_current_user_id
content = re.sub(
    r'def get_optional_current_user_id\([\s\S]*?except \(jwt\.ExpiredSignatureError, jwt\.InvalidTokenError, ValueError\):\s*return None',
    '''def get_optional_current_user_id(
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
        return None''',
    content
)

# Remove get_current_admin_user
content = re.sub(
    r'def get_current_admin_user\([\s\S]*?detail="Token không hợp lệ\.",\s*\)',
    '',
    content
)

# Fix merge conflicts at the end
content = re.sub(
    r'<<<<<<< HEAD[\s\S]*?=======\s*get_current_admin = require_admin\s*>>>>>>> origin/main',
    '''def get_auth_use_case(
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

get_current_admin = require_admin''',
    content
)

with open('app/entrypoints/dependencies.py', 'w') as f:
    f.write(content)
