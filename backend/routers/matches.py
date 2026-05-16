from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from database import get_db
from dependencies import get_current_user
from exceptions import AppError
from models.user import User
from schemas.match import MatchResponse, MatchListResponse, SubmitResultRequest, StandingsResponse
from services.tournaments import get_tournament
from services.matches import (
    generate_matches,
    get_matches,
    get_standings,
    match_to_response,
    submit_result,
)


router = APIRouter()


def _ensure_organizer(tournament_id: UUID, user_id: UUID, db: Session):
    tournament = get_tournament(tournament_id, db)
    if tournament.organizer_id != user_id:
        raise AppError(403, "Only the organizer can perform this action")
    return tournament


@router.post(
    "/tournaments/{tournament_id}/generate",
    response_model=MatchListResponse,
    status_code=201,
)
def generate_matches_endpoint(
    tournament_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate bracket per tournament.bracket_type. Organizer only. One-shot per tournament."""
    _ensure_organizer(tournament_id, current_user.id, db)
    matches = generate_matches(tournament_id, db)
    items = [match_to_response(m, db) for m in matches]
    return MatchListResponse(items=items, total=len(items))


@router.get(
    "/tournaments/{tournament_id}/matches",
    response_model=MatchListResponse,
)
def list_matches_endpoint(
    tournament_id: UUID,
    db: Session = Depends(get_db),
):
    """List matches for a tournament (public)."""
    matches = get_matches(tournament_id, db)
    items = [match_to_response(m, db) for m in matches]
    return MatchListResponse(items=items, total=len(items))


@router.get(
    "/tournaments/{tournament_id}/standings",
    response_model=StandingsResponse,
)
def standings_endpoint(
    tournament_id: UUID,
    db: Session = Depends(get_db),
):
    """Aggregate wins/losses per participant — useful for round-robin tournaments."""
    rows = get_standings(tournament_id, db)
    return StandingsResponse(items=rows)


@router.patch(
    "/tournaments/{tournament_id}/matches/{match_id}/result",
    response_model=MatchResponse,
)
def submit_match_result_endpoint(
    tournament_id: UUID,
    match_id: UUID,
    data: SubmitResultRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit match result. Organizer only. Advances winner using stored feeder mapping."""
    _ensure_organizer(tournament_id, current_user.id, db)
    match = submit_result(tournament_id, match_id, data.winner_participant_id, db)
    return match_to_response(match, db)
