from datetime import datetime
from uuid import UUID

from sqlalchemy import Integer, String, TIMESTAMP, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Match(Base):
    __tablename__ = "matches"
    __table_args__ = (UniqueConstraint("tournament_id", "round_number", "match_number"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    tournament_id: Mapped[UUID] = mapped_column(ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False)
    round_number: Mapped[int] = mapped_column(Integer(), nullable=False)
    match_number: Mapped[int] = mapped_column(Integer(), nullable=False)
    participant_a_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("tournament_participants.id", ondelete="SET NULL"), nullable=True
    )
    participant_b_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("tournament_participants.id", ondelete="SET NULL"), nullable=True
    )
    winner_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("tournament_participants.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(50), server_default="pending", nullable=False)
    scheduled_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(), nullable=True)

    tournament: Mapped["Tournament"] = relationship(back_populates="matches")
