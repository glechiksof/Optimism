import secrets
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from models.join_token import JoinToken
from exceptions import AppError


def create_token(team_id: UUID, db: Session) -> JoinToken:
    """Generate 7-day expiring join token for team."""
    token_str = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=7)

    token = JoinToken(team_id=team_id, token=token_str, expires_at=expires_at, is_active=True)
    db.add(token)
    db.commit()
    db.refresh(token)
    return token


def validate_token(token_str: str, db: Session) -> JoinToken:
    """Validate token exists, is active, and not expired."""
    token = db.query(JoinToken).filter(JoinToken.token == token_str).first()
    if not token:
        raise AppError(400, "Invalid token")
    if not token.is_active:
        raise AppError(400, "Token is inactive")
    if token.expires_at < datetime.utcnow():
        raise AppError(400, "Token expired")
    return token
