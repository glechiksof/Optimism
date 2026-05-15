from datetime import datetime
from uuid import UUID

from sqlalchemy import Integer, String, TIMESTAMP, ForeignKey, UniqueConstraint, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Match(Base):
    __tablename__ = "matches"
    __table_args__ = (
        UniqueConstraint("tournament_id", "round_number", "match_number"),
        CheckConstraint("feeds_into_slot IS NULL OR feeds_into_slot IN ('a', 'b')", name="ck_matches_feeds_into_slot"),
    )

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
    feeds_into_match_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("matches.id", ondelete="SET NULL"), nullable=True
    )
    feeds_into_slot: Mapped[str | None] = mapped_column(String(1), nullable=True)

    tournament: Mapped["Tournament"] = relationship(back_populates="matches")
