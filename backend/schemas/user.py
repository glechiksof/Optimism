from pydantic import BaseModel, EmailStr, Field, field_validator
from uuid import UUID
from typing import Optional
from datetime import datetime


# 300 KB cap on avatar payload (frontend caps at 200 KB; backend leaves slack
# for base64 overhead and Content-Type prefix).
MAX_AVATAR_URL_LEN = 300_000


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    username: str
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    username: Optional[str] = Field(default=None, min_length=1, max_length=100)
    avatar_url: Optional[str] = None

    @field_validator("avatar_url")
    @classmethod
    def cap_avatar_size(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if len(v) > MAX_AVATAR_URL_LEN:
            raise ValueError(
                f"avatar_url exceeds maximum size ({MAX_AVATAR_URL_LEN} chars). "
                "Compress or resize the image before uploading."
            )
        return v
