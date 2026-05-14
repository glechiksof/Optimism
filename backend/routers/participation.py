from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from database import get_db
from dependencies import get_current_user
from models.user import User
from schemas.participation import (
    JoinTournamentRequest,
    ParticipantResponse,
    ParticipantListResponse,
    ParticipationStatusResponse,
)
from services.participation import join_tournament, get_participants, get_status


router = APIRouter()


@router.post(
    "/tournaments/{tournament_id}/join",
    response_model=ParticipantResponse,
    status_code=201,
)
def join_tournament_endpoint(
    tournament_id: UUID,
    data: JoinTournamentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Register the current user for a tournament (optionally as a team)."""
    participant = join_tournament(tournament_id, current_user.id, data.team_id, db)
    return participant


@router.get(
    "/tournaments/{tournament_id}/participants",
    response_model=ParticipantListResponse,
)
def list_participants_endpoint(
    tournament_id: UUID,
    db: Session = Depends(get_db),
):
    """List participants for a tournament (public)."""
    participants = get_participants(tournament_id, db)
    return ParticipantListResponse(items=participants, total=len(participants))


@router.get(
    "/tournaments/{tournament_id}/status",
    response_model=ParticipationStatusResponse,
)
def participation_status_endpoint(
    tournament_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return whether current user is registered for tournament."""
    return get_status(tournament_id, current_user.id, db)
