from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime


class JoinTournamentRequest(BaseModel):
    team_id: Optional[UUID] = None


class ParticipantResponse(BaseModel):
    id: UUID
    tournament_id: UUID
    user_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    manual_name: Optional[str] = None
    registered_at: datetime

    class Config:
        from_attributes = True


class ParticipationStatusResponse(BaseModel):
    is_participant: bool
    participant_id: Optional[UUID] = None


class ParticipantListResponse(BaseModel):
    items: list[ParticipantResponse]
    total: int
