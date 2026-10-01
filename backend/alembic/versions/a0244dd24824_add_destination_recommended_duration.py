"""add destination recommended duration

Revision ID: a0244dd24824
Revises: 57d16b33847a
Create Date: 2026-09-29 20:21:21.174786

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a0244dd24824'
down_revision: Union[str, Sequence[str], None] = '57d16b33847a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "destinations",
        sa.Column(
            "recommended_min_days",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
    )

    op.add_column(
        "destinations",
        sa.Column(
            "recommended_max_days",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
    )


def downgrade() -> None:
    op.drop_column("destinations", "recommended_max_days")
    op.drop_column("destinations", "recommended_min_days")