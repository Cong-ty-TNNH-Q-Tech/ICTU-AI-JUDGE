import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator


class CreateInviteResponseDTO(BaseModel):
    token: str
    invite_url: str
    expires_at: datetime


class JoinTeamRequestDTO(BaseModel):
    token: str


class TeamResponseDTO(BaseModel):
    id: uuid.UUID
    name: str
    challenge_id: uuid.UUID
    leader_id: uuid.UUID
    created_at: datetime
    member_ids: list[uuid.UUID]


class TeamUpdateRequestDTO(BaseModel):
    name: str

    @field_validator('name')
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError('Tên đội không được để trống')
        if len(stripped) > 100:
            raise ValueError('Tên đội không được vượt quá 100 ký tự')
        return stripped
