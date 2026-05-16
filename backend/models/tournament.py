from datetime import datetime
from uuid import UUID

from sqlalchemy import String, Text, Integer, Boolean, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Tournament(Base):
    __tablename__ = "tournaments"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    organizer_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    sport_type: Mapped[str] = mapped_column(String(100), nullable=False)
    bracket_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    max_participants: Mapped[int] = mapped_column(Integer(), nullable=False)
    current_participants: Mapped[int] = mapped_column(Integer(), server_default="0", nullable=False)
    start_date: Mapped[datetime] = mapped_column(TIMESTAMP(), nullable=False)
    end_date: Mapped[datetime] = mapped_column(TIMESTAMP(), nullable=False)
    status: Mapped[str] = mapped_column(String(50), server_default="draft", nullable=False)
    is_visible: Mapped[bool] = mapped_column(Boolean(), server_default="true", nullable=False)
    is_team_based: Mapped[bool] = mapped_column(Boolean(), server_default="false", nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(), server_default=func.now())

    organizer: Mapped["User"] = relationship(back_populates="tournaments")
    participants: Mapped[list["TournamentParticipant"]] = relationship(back_populates="tournament")
    matches: Mapped[list["Match"]] = relationship(back_populates="tournament")
