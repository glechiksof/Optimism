"""create matches table

Revision ID: 006
Revises: 005
Create Date: 2026-05-11 09:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "matches",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("tournament_id", sa.UUID(), nullable=False),
        sa.Column("round_number", sa.Integer(), nullable=False),
        sa.Column("match_number", sa.Integer(), nullable=False),
        sa.Column("participant_a_id", sa.UUID(), nullable=True),
        sa.Column("participant_b_id", sa.UUID(), nullable=True),
        sa.Column("winner_id", sa.UUID(), nullable=True),
        sa.Column("status", sa.String(50), server_default="pending", nullable=False),
        sa.Column("scheduled_at", sa.TIMESTAMP(), nullable=True),
        sa.Column("completed_at", sa.TIMESTAMP(), nullable=True),
        sa.ForeignKeyConstraint(["tournament_id"], ["tournaments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["participant_a_id"], ["tournament_participants.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["participant_b_id"], ["tournament_participants.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["winner_id"], ["tournament_participants.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tournament_id", "round_number", "match_number"),
    )


def downgrade() -> None:
    op.drop_table("matches")
