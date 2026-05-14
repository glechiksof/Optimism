from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models.tournament import Tournament
from models.membership import TournamentParticipant
from models.team import Team
from exceptions import AppError
from services.tournaments import get_tournament


OPEN_STATUSES = {"open", "published"}


def join_tournament(
    tournament_id: UUID, user_id: UUID, team_id: UUID | None, db: Session
) -> TournamentParticipant:
    """Register a user (optionally as part of a team) for a tournament."""
    tournament = get_tournament(tournament_id, db)

    if tournament.status not in OPEN_STATUSES:
        raise AppError(422, "Tournament is not open for registration")

    existing = db.query(TournamentParticipant).filter(
        and_(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.user_id == user_id,
        )
    ).first()
    if existing:
        raise AppError(409, "Already registered for this tournament")

    if team_id is not None:
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise AppError(404, "Team not found")
        if team.tournament_id and team.tournament_id != tournament_id:
            raise AppError(422, "Team belongs to a different tournament")

    if tournament.current_participants >= tournament.max_participants:
        raise AppError(422, "Tournament is full")

    participant = TournamentParticipant(
        tournament_id=tournament_id,
        user_id=user_id,
        team_id=team_id,
    )
    db.add(participant)
    tournament.current_participants += 1
    db.commit()
    db.refresh(participant)
    return participant


def get_participants(tournament_id: UUID, db: Session) -> list[TournamentParticipant]:
    get_tournament(tournament_id, db)
    return (
        db.query(TournamentParticipant)
        .filter(TournamentParticipant.tournament_id == tournament_id)
        .order_by(TournamentParticipant.registered_at.asc())
        .all()
    )


def get_status(tournament_id: UUID, user_id: UUID, db: Session):
    get_tournament(tournament_id, db)
    participant = db.query(TournamentParticipant).filter(
        and_(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.user_id == user_id,
        )
    ).first()
    return {
        "is_participant": participant is not None,
        "participant_id": participant.id if participant else None,
    }
