from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID

from database import get_db
from dependencies import get_current_user
from models.user import User
from models.team import Team, TeamMember
from schemas.team import TeamCreate, TeamUpdate, TeamResponse, TeamListResponse, TeamMemberResponse
from services.teams import (
    create_team,
    get_team_or_404,
    list_teams,
    update_team,
    delete_team,
    join_team,
)

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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Join a team (placeholder for token handling)."""
    member = join_team(team_id, current_user.id, db=db)
    return member
