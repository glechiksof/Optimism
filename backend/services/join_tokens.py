import secrets
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from models.join_token import JoinToken
from exceptions import AppError


def create_token(team_id: UUID, db: Session) -> JoinToken:
    """Generate 7-day expiring single-use join token for team."""
    token_str = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=7)

    token = JoinToken(team_id=team_id, token=token_str, expires_at=expires_at, is_active=True)
    db.add(token)
    db.commit()
    db.refresh(token)
    return token


def validate_token(token_str: str, team_id: UUID, db: Session) -> JoinToken:
    """Validate token exists, belongs to team, is active, not used, not expired."""
    token = db.query(JoinToken).filter(JoinToken.token == token_str).first()
    if not token:
        raise AppError(400, "Invalid token")
    if token.team_id != team_id:
        raise AppError(400, "Token not valid for this team")
    if not token.is_active:
        raise AppError(400, "Token is inactive")
    if token.used_at is not None:
        raise AppError(400, "Token has already been used")
    if token.expires_at < datetime.utcnow():
        raise AppError(400, "Token expired")
    return token


def mark_token_used(token_id: UUID, user_id: UUID, db: Session) -> None:
    """Record consumption: set used_at, used_by_user_id, deactivate."""
    token = db.query(JoinToken).filter(JoinToken.id == token_id).first()
    if not token:
        return
    token.used_at = datetime.utcnow()
    token.used_by_user_id = user_id
    token.is_active = False
    db.commit()


def revoke_token(token_id: UUID, team_id: UUID, db: Session) -> None:
    """Mark token as inactive (soft-revoke). Does not delete the row."""
    token = db.query(JoinToken).filter(
        JoinToken.id == token_id, JoinToken.team_id == team_id
    ).first()
    if not token:
        raise AppError(404, "Token not found")
    token.is_active = False
    db.commit()
