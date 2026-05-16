from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from exceptions import AppError
from models.match import Match
from models.user import User
from schemas.tournament import TournamentResponse
from services.tournaments import get_tournament


router = APIRouter()


ALLOWED_TRANSITIONS = {
    ("draft", "open"),
    ("open", "closed"),
    ("closed", "started"),
}


def _assert_organizer(tournament, user: User):
    if tournament.organizer_id != user.id:
        raise AppError(403, "Only the organizer can perform this action")


def _transition(tournament_id: UUID, target: str, user: User, db: Session):
    tournament = get_tournament(tournament_id, db)
    _assert_organizer(tournament, user)
    current = tournament.status
    if (current, target) not in ALLOWED_TRANSITIONS:
        raise AppError(422, f"Cannot transition from '{current}' to '{target}'")
    if target == "started":
        match_count = db.query(Match).filter(Match.tournament_id == tournament_id).count()
        if match_count == 0:
            raise AppError(422, "Generate the bracket before starting the tournament")
    tournament.status = target
    tournament.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(tournament)
    return tournament


@router.post("/tournaments/{tournament_id}/publish", response_model=TournamentResponse)
def publish_endpoint(
    tournament_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """draft -> open. Tournament becomes searchable and accepts registrations."""
    return _transition(tournament_id, "open", current_user, db)


@router.post("/tournaments/{tournament_id}/close", response_model=TournamentResponse)
def close_endpoint(
    tournament_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """open -> closed. Registration locked; bracket may now be generated."""
    return _transition(tournament_id, "closed", current_user, db)


@router.post("/tournaments/{tournament_id}/start", response_model=TournamentResponse)
def start_endpoint(
    tournament_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """closed -> started. Requires generated bracket."""
    return _transition(tournament_id, "started", current_user, db)
