from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime

from models.team import Team
from models.membership import TeamMember
from schemas.team import TeamCreate, TeamUpdate
from exceptions import AppError
from services.join_tokens import validate_token


def _count_members(team_id: UUID, db: Session) -> int:
    """Count all team members (registered + manual). Authoritative for capacity checks."""
    return db.query(TeamMember).filter(TeamMember.team_id == team_id).count()


def create_team(data: TeamCreate, creator_id: UUID, db: Session) -> Team:
    """Create team with optional manual members."""
    if len(data.manual_members) > data.capacity:
        raise AppError(422, f"Manual members ({len(data.manual_members)}) exceed capacity ({data.capacity})")

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

    for member_item in data.manual_members:
        member = TeamMember(team_id=team.id, manual_name=member_item.name)
        db.add(member)

    team.current_size = len(data.manual_members)
    db.commit()
    db.refresh(team)
    return team


def get_team_or_404(team_id: UUID, db: Session) -> Team:
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise AppError(404, "Team not found")
    return team


def list_teams(tournament_id: UUID | None, visible_only: bool, db: Session) -> list[Team]:
    """List teams with optional tournament filter and visibility filter."""
    query = db.query(Team)
    if tournament_id:
        query = query.filter(Team.tournament_id == tournament_id)
    if visible_only:
        query = query.filter(Team.is_visible == True)
    return query.order_by(Team.created_at.desc()).all()


def update_team(team_id: UUID, data: TeamUpdate, creator_id: UUID, db: Session) -> Team:
    team = get_team_or_404(team_id, db)
    if team.created_by != creator_id:
        raise AppError(403, "Only team creator can update")

    # Guard capacity reduction below actual member count
    if data.capacity is not None:
        actual = _count_members(team_id, db)
        if data.capacity < actual:
            raise AppError(422, f"Cannot reduce capacity to {data.capacity}: team has {actual} members")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(team, key, value)

    team.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(team)
    return team


def delete_team(team_id: UUID, creator_id: UUID, db: Session) -> None:
    team = get_team_or_404(team_id, db)
    if team.created_by != creator_id:
        raise AppError(403, "Only team creator can delete")
    db.delete(team)
    db.commit()


def join_team(team_id: UUID, user_id: UUID, token_str: str | None, db: Session) -> TeamMember:
    """Join team based on join_method. Capacity is real-time checked via _count_members."""
    team = get_team_or_404(team_id, db)

    # Check join_method first
    if team.join_method == "manual":
        raise AppError(403, "Join is by manual invitation only")
    elif team.join_method == "link":
        if not token_str:
            raise AppError(400, "Token required for link join")
        validate_token(token_str, team_id, db)
    elif team.join_method == "mixed":
        if token_str:
            validate_token(token_str, team_id, db)
    # team_page: no token required

    # Duplicate check before capacity (cheaper, short-circuits early)
    existing = db.query(TeamMember).filter(
        and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
    ).first()
    if existing:
        raise AppError(409, "Already a member of this team")

    # Capacity check (real-time count, not stale current_size)
    # Note: not protected against race conditions under high concurrency
    member_count = _count_members(team_id, db)
    if member_count >= team.capacity:
        raise AppError(422, "Team is full")

    member = TeamMember(team_id=team_id, user_id=user_id)
    db.add(member)
    team.current_size += 1
    db.commit()
    db.refresh(member)
    return member
