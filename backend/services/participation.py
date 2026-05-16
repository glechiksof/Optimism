from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_
from sqlalchemy.exc import IntegrityError

from models.tournament import Tournament
from models.membership import TournamentParticipant
from models.team import Team
from exceptions import AppError
from services.tournaments import get_tournament


OPEN_STATUSES = {"open"}
JOINABLE_STATUSES = {"open"}
LEAVABLE_STATUSES = {"open", "closed"}  # can leave before bracket starts


def _get_tournament_for_update(tournament_id: UUID, db: Session) -> Tournament:
    """Lock the tournament row to serialize concurrent join/leave calls."""
    tournament = (
        db.query(Tournament)
        .filter(Tournament.id == tournament_id)
        .with_for_update()
        .first()
    )
    if not tournament:
        raise AppError(404, "Tournament not found")
    return tournament


def join_tournament(
    tournament_id: UUID, user_id: UUID, team_id: UUID | None, db: Session
) -> TournamentParticipant:
    """Register a user (optionally as part of a team) for a tournament."""
    tournament = _get_tournament_for_update(tournament_id, db)

    if tournament.is_team_based:
        raise AppError(
            422,
            "This is a team-based tournament. The organizer adds whole teams; individual sign-ups are disabled.",
        )

    if tournament.status not in JOINABLE_STATUSES:
        raise AppError(422, "Tournament is not open for registration")

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
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError(409, "Already registered for this tournament")
    db.refresh(participant)
    return participant


def leave_tournament(tournament_id: UUID, user_id: UUID, db: Session) -> None:
    """Allow a user to cancel their registration before the tournament starts."""
    tournament = _get_tournament_for_update(tournament_id, db)
    if tournament.status not in LEAVABLE_STATUSES:
        raise AppError(422, "Cannot leave after the tournament has started")
    participant = db.query(TournamentParticipant).filter(
        and_(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.user_id == user_id,
        )
    ).first()
    if not participant:
        raise AppError(404, "You are not registered for this tournament")
    db.delete(participant)
    if tournament.current_participants > 0:
        tournament.current_participants -= 1
    db.commit()


def remove_participant(
    tournament_id: UUID, participant_id: UUID, organizer_id: UUID, db: Session
) -> None:
    """Organizer-only removal of a participant before the tournament starts."""
    tournament = _get_tournament_for_update(tournament_id, db)
    if tournament.organizer_id != organizer_id:
        raise AppError(403, "Only the organizer can remove participants")
    if tournament.status not in LEAVABLE_STATUSES:
        raise AppError(422, "Cannot remove participants after the tournament has started")
    participant = db.query(TournamentParticipant).filter(
        and_(
            TournamentParticipant.id == participant_id,
            TournamentParticipant.tournament_id == tournament_id,
        )
    ).first()
    if not participant:
        raise AppError(404, "Participant not found")
    db.delete(participant)
    if tournament.current_participants > 0:
        tournament.current_participants -= 1
    db.commit()


MIN_TEAM_MEMBERS_FOR_TOURNAMENT = 2


def add_team_to_tournament(
    tournament_id: UUID, team_id: UUID, organizer_id: UUID, db: Session
) -> TournamentParticipant:
    """Organizer adds an existing public team to a team-based tournament.
    Inserts a single TournamentParticipant row with team_id set and user_id=NULL.
    The team's own members do not individually register."""
    from models.membership import TeamMember

    tournament = _get_tournament_for_update(tournament_id, db)
    if tournament.organizer_id != organizer_id:
        raise AppError(403, "Only the organizer can add teams")
    if not tournament.is_team_based:
        raise AppError(422, "This tournament is not team-based")
    if tournament.status != "open":
        raise AppError(422, "Tournament is not open for registration")
    if tournament.current_participants >= tournament.max_participants:
        raise AppError(422, "Tournament is full")

    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise AppError(404, "Team not found")
    if not team.is_visible:
        raise AppError(422, "Only public teams can be added to a tournament")

    member_count = db.query(TeamMember).filter(TeamMember.team_id == team_id).count()
    if member_count < MIN_TEAM_MEMBERS_FOR_TOURNAMENT:
        raise AppError(
            422,
            f"Team needs at least {MIN_TEAM_MEMBERS_FOR_TOURNAMENT} members to enter a tournament",
        )

    # Duplicate check (DB also enforces uq_tournament_team partial unique index).
    existing = db.query(TournamentParticipant).filter(
        and_(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.team_id == team_id,
        )
    ).first()
    if existing:
        raise AppError(409, "Team is already in this tournament")

    participant = TournamentParticipant(
        tournament_id=tournament_id,
        team_id=team_id,
        user_id=None,
    )
    db.add(participant)
    tournament.current_participants += 1
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise AppError(409, "Team is already in this tournament")
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


def get_joined_tournaments(user_id: UUID, db: Session) -> list[Tournament]:
    """Return tournaments the user is registered for, newest first."""
    return (
        db.query(Tournament)
        .join(TournamentParticipant, TournamentParticipant.tournament_id == Tournament.id)
        .filter(TournamentParticipant.user_id == user_id)
        .order_by(Tournament.start_date.desc())
        .all()
    )
