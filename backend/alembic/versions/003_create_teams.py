"""create teams table

Revision ID: 003
Revises: 002
Create Date: 2026-05-11 09:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "teams",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("tournament_id", sa.UUID(), nullable=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("current_size", sa.Integer(), server_default="0", nullable=False),
        sa.Column("join_method", sa.String(50), server_default="team_page", nullable=False),
        sa.Column("is_visible", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["tournament_id"], ["tournaments.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("teams")
