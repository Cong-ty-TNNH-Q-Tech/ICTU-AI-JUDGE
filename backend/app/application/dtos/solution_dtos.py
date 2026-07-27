import uuid
import datetime
from pydantic import BaseModel

class SolutionResponseDTO(BaseModel):
    id: uuid.UUID
    challenge_id: uuid.UUID
    user_id: uuid.UUID
    author_name: str = ""
    title: str
    content: str
    notebook_url: str
    upvotes: int
    created_at: datetime.datetime

class SolutionListResponseDTO(BaseModel):
    items: list[SolutionResponseDTO]
    total: int
    page: int = 1
    size: int = 100
    total_pages: int = 1
