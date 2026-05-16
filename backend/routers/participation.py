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
    add_team_to_tournament,
)
from pydantic import BaseModel


class AddTeamRequest(BaseModel):
    team_id: UUID


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


@router.post(
    "/tournaments/{tournament_id}/teams",
    response_model=ParticipantResponse,
    status_code=201,
)
def add_team_endpoint(
    tournament_id: UUID,
    data: AddTeamRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Organizer-only: add an existing public team to a team-based tournament."""
    participant = add_team_to_tournament(tournament_id, data.team_id, current_user.id, db)
    return participant


@router.get(
    "/tournaments/{tournament_id}/participants",
    response_model=ParticipantListResponse,
)
def list_participants_endpoint(
    tournament_id: UUID,
    db: Session = Depends(get_db),
):
    """List participants for a tournament (public). Hydrates username and
    team_name so the UI can label rows without extra round-trips."""
    from models.user import User
    from models.team import Team
    participants = get_participants(tournament_id, db)
    user_ids = {p.user_id for p in participants if p.user_id}
    team_ids = {p.team_id for p in participants if p.team_id}
    users_by_id = {
        u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()
    } if user_ids else {}
    teams_by_id = {
        t.id: t for t in db.query(Team).filter(Team.id.in_(team_ids)).all()
    } if team_ids else {}
    items = []
    for p in participants:
        items.append({
            "id": p.id,
            "tournament_id": p.tournament_id,
            "user_id": p.user_id,
            "team_id": p.team_id,
            "manual_name": p.manual_name,
            "username": users_by_id.get(p.user_id).username if p.user_id and p.user_id in users_by_id else None,
            "team_name": teams_by_id.get(p.team_id).name if p.team_id and p.team_id in teams_by_id else None,
            "registered_at": p.registered_at,
        })
    return ParticipantListResponse(items=items, total=len(items))


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
