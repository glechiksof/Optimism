from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional
from datetime import datetime


class ManualMemberItem(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class TeamCreate(BaseModel):
    tournament_id: Optional[UUID] = None
    name: str = Field(min_length=1, max_length=200)
    capacity: int = Field(ge=2)
    join_method: str = Field(default="team_page")  # manual, team_page, link, mixed
    is_visible: bool = True
    manual_members: list[ManualMemberItem] = []


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    join_method: Optional[str] = None
    is_visible: Optional[bool] = None


class TeamMemberResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    manual_name: Optional[str] = None
    joined_at: datetime

    class Config:
        from_attributes = True


class TeamResponse(BaseModel):
    id: UUID
    name: str
    tournament_id: Optional[UUID] = None
    capacity: int
    current_size: int
    join_method: str
    is_visible: bool
    created_by: UUID
    members: list[TeamMemberResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class TeamListResponse(BaseModel):
    items: list[TeamResponse]
    total: int
