from datetime import datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.tournament import Tournament
from schemas.tournament import TournamentCreate, TournamentUpdate

LOCKED_STATUSES = {"started", "finished"}
LOCKED_FIELDS = {"bracket_type", "max_participants", "start_date", "end_date", "sport_type", "name"}


def create_tournament(data: TournamentCreate, organizer_id: UUID, db: Session) -> Tournament:
    tournament = Tournament(
        organizer_id=organizer_id,
        name=data.name,
        sport_type=data.sport_type,
        bracket_type=data.bracket_type,
        description=data.description,
        max_participants=data.max_participants,
        start_date=data.start_date,
        end_date=data.end_date,
        is_visible=data.is_visible,
        status="draft",
    )
    db.add(tournament)
    db.commit()
    db.refresh(tournament)
    return tournament


def get_tournament(tournament_id: UUID, db: Session) -> Tournament:
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return tournament


def list_tournaments(
    db: Session,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Tournament], int]:
    query = db.query(Tournament).filter(
        Tournament.status != "draft",
        Tournament.is_visible == True,
    )
    if search:
        query = query.filter(Tournament.name.ilike(f"%{search}%"))
    total = query.count()
    items = query.order_by(Tournament.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def get_hosted_tournaments(organizer_id: UUID, db: Session) -> list[Tournament]:
    return (
        db.query(Tournament)
        .filter(Tournament.organizer_id == organizer_id)
        .order_by(Tournament.created_at.desc())
        .all()
    )


def update_tournament(
    tournament_id: UUID, data: TournamentUpdate, current_user_id: UUID, db: Session
) -> Tournament:
    tournament = get_tournament(tournament_id, db)

    if tournament.organizer_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not the organizer")

    update_data = data.model_dump(exclude_unset=True)

    if tournament.status in LOCKED_STATUSES:
        forbidden = LOCKED_FIELDS.intersection(update_data.keys())
        if forbidden:
            raise HTTPException(
                status_code=422,
                detail=f"Cannot change {', '.join(sorted(forbidden))} after tournament has started",
            )

    for field, value in update_data.items():
        setattr(tournament, field, value)

    tournament.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(tournament)
    return tournament


def delete_tournament(tournament_id: UUID, current_user_id: UUID, db: Session) -> None:
    tournament = get_tournament(tournament_id, db)

    if tournament.organizer_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not the organizer")

    if tournament.status in LOCKED_STATUSES:
        raise HTTPException(status_code=422, detail="Cannot delete a tournament that has started")

    db.delete(tournament)
    db.commit()
