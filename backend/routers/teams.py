from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from database import get_db
from dependencies import get_current_user
from exceptions import AppError
from models.user import User
from models.join_token import JoinToken
from models.membership import TeamMember
from schemas.team import TeamCreate, TeamUpdate, TeamResponse, TeamListResponse, TeamMemberResponse
from services.teams import (
    create_team,
    get_team_or_404,
    list_teams,
    update_team,
    delete_team,
    join_team,
)
from services.join_tokens import create_token


class JoinTokenResponse(BaseModel):
    id: UUID
    token: str
    expires_at: datetime

    class Config:
        from_attributes = True


class JoinRequest(BaseModel):
    token: str | None = None

router = APIRouter()


@router.post("/teams", response_model=TeamResponse, status_code=201)
def create_team_endpoint(
    data: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new team."""
    team = create_team(data, current_user.id, db)
    return team


@router.get("/teams", response_model=TeamListResponse)
def list_teams_endpoint(
    tournament_id: UUID | None = Query(None),
    visible_only: bool = Query(True),
    db: Session = Depends(get_db),
):
    """List teams (public endpoint)."""
    teams = list_teams(tournament_id, visible_only, db)
    return TeamListResponse(items=teams, total=len(teams))


@router.get("/teams/{team_id}", response_model=TeamResponse)
def get_team_endpoint(team_id: UUID, db: Session = Depends(get_db)):
    """Get team details (public endpoint)."""
    team = get_team_or_404(team_id, db)
    return team


@router.patch("/teams/{team_id}", response_model=TeamResponse)
def update_team_endpoint(
    team_id: UUID,
    data: TeamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update team (owner only)."""
    team = update_team(team_id, data, current_user.id, db)
    return team


@router.delete("/teams/{team_id}", status_code=204)
def delete_team_endpoint(
    team_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete team (owner only)."""
    delete_team(team_id, current_user.id, db)
    return None


@router.post("/teams/{team_id}/join", response_model=TeamMemberResponse, status_code=201)
def join_team_endpoint(
    team_id: UUID,
    data: JoinRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Join a team with optional token."""
    member = join_team(team_id, current_user.id, token_str=data.token, db=db)
    return member


@router.post("/teams/{team_id}/tokens", response_model=JoinTokenResponse, status_code=201)
def create_join_token_endpoint(
    team_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create join token (owner only)."""
    team = get_team_or_404(team_id, db)
    if team.created_by != current_user.id:
        raise AppError(403, "Only team creator can create tokens")
    token = create_token(team_id, db)
    return token


@router.get("/teams/{team_id}/tokens", response_model=list[JoinTokenResponse])
def list_join_tokens_endpoint(
    team_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List active join tokens (owner only)."""
    team = get_team_or_404(team_id, db)
    if team.created_by != current_user.id:
        raise AppError(403, "Only team creator can list tokens")
    tokens = db.query(JoinToken).filter(
        (JoinToken.team_id == team_id) & (JoinToken.is_active == True)
    ).all()
    return tokens
