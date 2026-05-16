from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models.user import User
from schemas.tournament import (
    TournamentCreate,
    TournamentListResponse,
    TournamentResponse,
    TournamentUpdate,
)
from services.tournaments import (
    create_tournament,
    delete_tournament,
    get_hosted_tournaments,
    get_tournament,
    list_tournaments,
    update_tournament,
)

router = APIRouter()


@router.post("", response_model=TournamentResponse, status_code=201)
def create(
    data: TournamentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_tournament(data, current_user.id, db)


@router.get("/hosted", response_model=list[TournamentResponse])
def hosted(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_hosted_tournaments(current_user.id, db)


@router.get("", response_model=TournamentListResponse)
def search(
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    type: str | None = Query(default=None, description="'solo' | 'team' | None for all"),
    db: Session = Depends(get_db),
):
    if type is not None and type not in {"solo", "team"}:
        from exceptions import AppError
        raise AppError(422, "type must be 'solo' or 'team'")
    items, total = list_tournaments(
        db, search=search, page=page, page_size=page_size, type_filter=type,
    )
    return TournamentListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{tournament_id}", response_model=TournamentResponse)
def get_one(tournament_id: UUID, db: Session = Depends(get_db)):
    return get_tournament(tournament_id, db)


@router.patch("/{tournament_id}", response_model=TournamentResponse)
def update(
    tournament_id: UUID,
    data: TournamentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_tournament(tournament_id, data, current_user.id, db)


@router.delete("/{tournament_id}", status_code=204)
def delete(
    tournament_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_tournament(tournament_id, current_user.id, db)
