from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class TournamentCreate(BaseModel):
    name: str
    sport_type: str
    bracket_type: str
    description: Optional[str] = None
    max_participants: int
    start_date: datetime
    end_date: datetime
    is_visible: bool = True
    is_team_based: bool = False

    @field_validator("bracket_type")
    @classmethod
    def validate_bracket_type(cls, v: str) -> str:
        allowed = {"single_elim", "round_robin"}
        if v not in allowed:
            raise ValueError(f"bracket_type must be one of {allowed}")
        return v

    @field_validator("max_participants")
    @classmethod
    def validate_max_participants(cls, v: int) -> int:
        if v < 2:
            raise ValueError("max_participants must be at least 2")
        return v

    @field_validator("end_date")
    @classmethod
    def validate_end_after_start(cls, v: datetime, info) -> datetime:
        start = info.data.get("start_date")
        if start and v <= start:
            raise ValueError("end_date must be after start_date")
        return v


class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    sport_type: Optional[str] = None
    bracket_type: Optional[str] = None
    description: Optional[str] = None
    max_participants: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_visible: Optional[bool] = None
    status: Optional[str] = None

    @field_validator("bracket_type")
    @classmethod
    def validate_bracket_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in {"single_elim", "round_robin"}:
            raise ValueError("bracket_type must be single_elim or round_robin")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        allowed = {"draft", "open", "closed", "started", "finished"}
        if v is not None and v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v


class TournamentResponse(BaseModel):
    id: UUID
    organizer_id: UUID
    name: str
    sport_type: str
    bracket_type: str
    description: Optional[str]
    max_participants: int
    current_participants: int
    start_date: datetime
    end_date: datetime
    status: str
    is_visible: bool
    is_team_based: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TournamentListResponse(BaseModel):
    items: list[TournamentResponse]
    total: int
    page: int
    page_size: int
