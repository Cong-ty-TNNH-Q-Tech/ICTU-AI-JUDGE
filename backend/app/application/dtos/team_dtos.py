import uuid
from datetime import datetime
from pydantic import BaseModel


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
