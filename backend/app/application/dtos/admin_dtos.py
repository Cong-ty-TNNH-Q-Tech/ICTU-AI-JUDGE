from datetime import datetime
import uuid
from pydantic import BaseModel, ConfigDict
from app.domain.entities.entities import UserRole

class UserDTO(BaseModel):
    id: uuid.UUID
    email: str
    student_id: str
    full_name: str
    role: UserRole
    created_at: datetime
    deleted_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

class UserListResponseDTO(BaseModel):
    data: list[UserDTO]
    total: int
    page: int
    size: int

class UserStatusUpdateRequestDTO(BaseModel):
    is_active: bool

class WhitelistAddRequestDTO(BaseModel):
    user_ids: list[uuid.UUID]
