from datetime import datetime
from uuid import UUID

from sqlalchemy import String, Boolean, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class JoinToken(Base):
    __tablename__ = "join_tokens"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    team_id: Mapped[UUID] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    token: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(TIMESTAMP(), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), server_default="true", nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(), nullable=True)
    used_by_user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(), server_default=func.now())

    team: Mapped["Team"] = relationship(back_populates="join_tokens")
