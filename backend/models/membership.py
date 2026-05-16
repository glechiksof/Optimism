from datetime import datetime
from uuid import UUID

from sqlalchemy import String, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class TournamentParticipant(Base):
    __tablename__ = "tournament_participants"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    tournament_id: Mapped[UUID] = mapped_column(ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    team_id: Mapped[UUID | None] = mapped_column(ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    manual_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    registered_at: Mapped[datetime] = mapped_column(TIMESTAMP(), server_default=func.now())

    tournament: Mapped["Tournament"] = relationship(back_populates="participants")


class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    team_id: Mapped[UUID] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    manual_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    joined_at: Mapped[datetime] = mapped_column(TIMESTAMP(), server_default=func.now())

    team: Mapped["Team"] = relationship(back_populates="members")
