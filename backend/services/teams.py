from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime

from models.team import Team, TeamMember
from models.user import User
from schemas.team import TeamCreate, TeamUpdate
from exceptions import AppError


def _count_members(team_id: UUID, db: Session) -> int:
    """Count all team members (registered + manual)."""
    return db.query(TeamMember).filter(TeamMember.team_id == team_id).count()


def create_team(data: TeamCreate, creator_id: UUID, db: Session) -> Team:
    """Create team with optional manual members."""
    team = Team(
        tournament_id=data.tournament_id,
        name=data.name,
        capacity=data.capacity,
        join_method=data.join_method,
        is_visible=data.is_visible,
        created_by=creator_id,
    )
    db.add(team)
    db.flush()

    # Add manual members
    for member_item in data.manual_members:
        member = TeamMember(team_id=team.id, manual_name=member_item.name)
        db.add(member)

    team.current_size = len(data.manual_members)
    db.commit()
    db.refresh(team)
    return team


def get_team_or_404(team_id: UUID, db: Session) -> Team:
    """Fetch team by ID or raise 404."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise AppError(404, "Team not found")
    return team


def list_teams(tournament_id: UUID | None = None, visible_only: bool = True, db: Session = None) -> list[Team]:
    """List teams with optional tournament filter and visibility filter."""
    query = db.query(Team)
    if tournament_id:
        query = query.filter(Team.tournament_id == tournament_id)
    if visible_only:
        query = query.filter(Team.is_visible == True)
    return query.order_by(Team.created_at.desc()).all()


def update_team(team_id: UUID, data: TeamUpdate, creator_id: UUID, db: Session) -> Team:
    """Update team (owner only)."""
    team = get_team_or_404(team_id, db)
    if team.created_by != creator_id:
        raise AppError(403, "Only team creator can update")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(team, key, value)

    team.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(team)
    return team


def delete_team(team_id: UUID, creator_id: UUID, db: Session) -> None:
    """Delete team (owner only)."""
    team = get_team_or_404(team_id, db)
    if team.created_by != creator_id:
        raise AppError(403, "Only team creator can delete")
    db.delete(team)
    db.commit()


def join_team(team_id: UUID, user_id: UUID, token_str: str | None = None, db: Session = None) -> TeamMember:
    """Join team based on join_method. Placeholder for detailed logic."""
    team = get_team_or_404(team_id, db)

    # Check member count (real-time)
    member_count = _count_members(team_id, db)
    if member_count >= team.capacity:
        raise AppError(422, "Team is full")

    # Check not already member
    existing = db.query(TeamMember).filter(
        and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
    ).first()
    if existing:
        raise AppError(409, "Already a member of this team")

    # Insert member
    member = TeamMember(team_id=team_id, user_id=user_id)
    db.add(member)
    team.current_size += 1
    db.commit()
    db.refresh(member)
    return member
