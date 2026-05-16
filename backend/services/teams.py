from uuid import UUID
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import and_
from sqlalchemy.exc import IntegrityError

from models.team import Team
from models.membership import TeamMember
from schemas.team import TeamCreate, TeamUpdate
from exceptions import AppError
from services.join_tokens import validate_token, mark_token_used


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


def _get_team_for_update(team_id: UUID, db: Session) -> Team:
    """Lock team row for serialized join/leave to prevent capacity oversell."""
    team = db.query(Team).filter(Team.id == team_id).with_for_update().first()
    if not team:
        raise AppError(404, "Team not found")
    return team


def list_teams(
    tournament_id: UUID | None,
    visible_only: bool,
    db: Session,
    requester_id: UUID | None = None,
) -> list[Team]:
    """List teams. Private teams returned only when requester is creator
    or a member; visible_only=False is honored only for that subset."""
    query = db.query(Team)
    if tournament_id:
        query = query.filter(Team.tournament_id == tournament_id)

    if visible_only:
        query = query.filter(Team.is_visible == True)
        return query.order_by(Team.created_at.desc()).all()

    # visible_only=False — include privates only for the requesting user
    if requester_id is None:
        # Anon caller cannot see private teams regardless of flag
        query = query.filter(Team.is_visible == True)
        return query.order_by(Team.created_at.desc()).all()

    from models.membership import TeamMember
    member_team_ids_subq = (
        db.query(TeamMember.team_id).filter(TeamMember.user_id == requester_id).subquery()
    )
    from sqlalchemy import or_
    query = query.filter(
        or_(
            Team.is_visible == True,
            Team.created_by == requester_id,
            Team.id.in_(member_team_ids_subq),
        )
    )
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
    team = _get_team_for_update(team_id, db)
    validated_token = None

    # Method gate
    if team.join_method == "manual":
        raise AppError(403, "Join is by manual invitation only")
    elif team.join_method == "link":
        if not token_str:
            raise AppError(400, "Token required for link join")
        validated_token = validate_token(token_str, team_id, db)
    elif team.join_method == "mixed":
        if token_str:
            validated_token = validate_token(token_str, team_id, db)
    # team_page: no token required

    # Capacity check (real-time count)
    member_count = _count_members(team_id, db)
    if member_count >= team.capacity:
        raise AppError(422, "Team is full")

    member = TeamMember(team_id=team_id, user_id=user_id)
    db.add(member)
    team.current_size = member_count + 1
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError(409, "Already a member of this team")
    if validated_token is not None:
        mark_token_used(validated_token.id, user_id, db)
    db.refresh(member)
    return member


def leave_team(team_id: UUID, user_id: UUID, db: Session) -> None:
    """Allow a member to leave a team. Creator cannot leave their own team — must delete it."""
    team = _get_team_for_update(team_id, db)
    if team.created_by == user_id:
        raise AppError(422, "Team creator cannot leave; delete the team instead")
    member = db.query(TeamMember).filter(
        and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
    ).first()
    if not member:
        raise AppError(404, "You are not a member of this team")
    db.delete(member)
    if team.current_size > 0:
        team.current_size -= 1
    db.commit()


def remove_member(team_id: UUID, member_id: UUID, creator_id: UUID, db: Session) -> None:
    """Creator-only removal of a team member."""
    team = _get_team_for_update(team_id, db)
    if team.created_by != creator_id:
        raise AppError(403, "Only the team creator can remove members")
    member = db.query(TeamMember).filter(
        and_(TeamMember.id == member_id, TeamMember.team_id == team_id)
    ).first()
    if not member:
        raise AppError(404, "Member not found")
    if member.user_id == creator_id:
        raise AppError(422, "Creator cannot be removed from their own team")
    db.delete(member)
    if team.current_size > 0:
        team.current_size -= 1
    db.commit()
