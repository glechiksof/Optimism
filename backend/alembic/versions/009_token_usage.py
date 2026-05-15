"""add used_at and used_by_user_id to join_tokens

Revision ID: 009
Revises: 008
Create Date: 2026-05-15 10:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("join_tokens", sa.Column("used_at", sa.TIMESTAMP(), nullable=True))
    op.add_column("join_tokens", sa.Column("used_by_user_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_join_tokens_used_by_user",
        "join_tokens",
        "users",
        ["used_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_join_tokens_used_by_user", "join_tokens", type_="foreignkey")
    op.drop_column("join_tokens", "used_by_user_id")
    op.drop_column("join_tokens", "used_at")
