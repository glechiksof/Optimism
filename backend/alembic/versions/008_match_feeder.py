"""add feeder columns to matches

Revision ID: 008
Revises: 007
Create Date: 2026-05-15 10:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "matches",
        sa.Column("feeds_into_match_id", sa.UUID(), nullable=True),
    )
    op.add_column(
        "matches",
        sa.Column("feeds_into_slot", sa.String(1), nullable=True),
    )
    op.create_foreign_key(
        "fk_matches_feeds_into_match",
        "matches",
        "matches",
        ["feeds_into_match_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_check_constraint(
        "ck_matches_feeds_into_slot",
        "matches",
        "feeds_into_slot IS NULL OR feeds_into_slot IN ('a', 'b')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_matches_feeds_into_slot", "matches", type_="check")
    op.drop_constraint("fk_matches_feeds_into_match", "matches", type_="foreignkey")
    op.drop_column("matches", "feeds_into_slot")
    op.drop_column("matches", "feeds_into_match_id")
