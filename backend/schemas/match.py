from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime


class MatchParticipantInfo(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    manual_name: Optional[str] = None
    username: Optional[str] = None

    class Config:
        from_attributes = True


class MatchResponse(BaseModel):
    id: UUID
    tournament_id: UUID
    round_number: int
    match_number: int
    participant_a: Optional[MatchParticipantInfo] = None
    participant_b: Optional[MatchParticipantInfo] = None
    winner_id: Optional[UUID] = None
    status: str
    scheduled_at: Optional[datetime] = None


class MatchListResponse(BaseModel):
    items: list[MatchResponse]
    total: int


class SubmitResultRequest(BaseModel):
    winner_participant_id: UUID
