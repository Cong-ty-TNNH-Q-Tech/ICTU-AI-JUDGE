import uuid
from pydantic import BaseModel, Field

class TagCreateRequestDTO(BaseModel):
    name: str = Field(..., max_length=100, description="Tên của tag")
    color_hex: str = Field(
        ..., 
        max_length=7, 
        pattern=r"^#[0-9a-fA-F]{6}$",
        description="Màu của tag dưới dạng HEX (vd: #FFFFFF)"
    )

class TagUpdateRequestDTO(BaseModel):
    name: str | None = Field(None, max_length=100)
    color_hex: str | None = Field(None, max_length=7, pattern=r"^#[0-9a-fA-F]{6}$")

class TagResponseDTO(BaseModel):
    id: uuid.UUID
    name: str
    color_hex: str

    model_config = {"from_attributes": True}
