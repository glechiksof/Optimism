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
from schemas.tournament import TournamentResponse
from services.participation import (
    join_tournament,
    leave_tournament,
    remove_participant,
    get_participants,
    get_status,
    get_joined_tournaments,
)


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


@router.delete(
    "/tournaments/{tournament_id}/leave",
    status_code=204,
)
def leave_tournament_endpoint(
    tournament_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel current user's registration. Allowed only while tournament is open or closed."""
    leave_tournament(tournament_id, current_user.id, db)
    return None


@router.delete(
    "/tournaments/{tournament_id}/participants/{participant_id}",
    status_code=204,
)
def remove_participant_endpoint(
    tournament_id: UUID,
    participant_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Organizer-only removal of a specific participant."""
    remove_participant(tournament_id, participant_id, current_user.id, db)
    return None


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


@router.get(
    "/users/me/joined-tournaments",
    response_model=list[TournamentResponse],
)
def list_joined_tournaments_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all tournaments the current user is registered for.

    Lives under /users/me/* to avoid collision with /tournaments/{id} parametric route.
    """
    return get_joined_tournaments(current_user.id, db)
