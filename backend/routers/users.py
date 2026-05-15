from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models.match import Match
from models.membership import TournamentParticipant
from models.tournament import Tournament
from models.user import User
from schemas.user import UserResponse, UserUpdateRequest


class UserStatsResponse(BaseModel):
    tournaments_organized: int
    tournaments_joined: int
    tournaments_won: int
    matches_played: int
    matches_won: int

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    data: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.username:
        current_user.username = data.username
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me/stats", response_model=UserStatsResponse)
def get_me_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate counters for the current user."""
    user_id = current_user.id
    organized = db.query(Tournament).filter(Tournament.organizer_id == user_id).count()

    participant_ids = [
        p.id for p in db.query(TournamentParticipant).filter(
            TournamentParticipant.user_id == user_id
        ).all()
    ]
    joined = len(participant_ids)

    matches_won = 0
    matches_played = 0
    if participant_ids:
        matches_played = db.query(Match).filter(
            Match.status == "completed",
            (Match.participant_a_id.in_(participant_ids)) | (Match.participant_b_id.in_(participant_ids)),
        ).count()
        matches_won = db.query(Match).filter(
            Match.status == "completed",
            Match.winner_id.in_(participant_ids),
        ).count()

    # Tournaments won: finished tournaments where this user has the winner of the highest-round match
    tournaments_won = 0
    if participant_ids:
        finished = db.query(Tournament).filter(
            Tournament.status == "finished",
            Tournament.organizer_id != user_id,
        ).all()
        for t in finished:
            top = db.query(Match).filter(
                Match.tournament_id == t.id, Match.status == "completed"
            ).order_by(Match.round_number.desc(), Match.match_number.desc()).first()
            if top and top.winner_id in participant_ids:
                tournaments_won += 1

    return UserStatsResponse(
        tournaments_organized=organized,
        tournaments_joined=joined,
        tournaments_won=tournaments_won,
        matches_played=matches_played,
        matches_won=matches_won,
    )
