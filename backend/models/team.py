from datetime import datetime
from uuid import UUID

from sqlalchemy import String, Integer, Boolean, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    tournament_id: Mapped[UUID | None] = mapped_column(ForeignKey("tournaments.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer(), nullable=False)
    current_size: Mapped[int] = mapped_column(Integer(), server_default="0", nullable=False)
    join_method: Mapped[str] = mapped_column(String(50), server_default="team_page", nullable=False)
    is_visible: Mapped[bool] = mapped_column(Boolean(), server_default="true", nullable=False)
    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(), server_default=func.now())

    creator: Mapped["User"] = relationship(back_populates="teams_created")
    members: Mapped[list["TeamMember"]] = relationship(back_populates="team")
    join_tokens: Mapped[list["JoinToken"]] = relationship(back_populates="team")
