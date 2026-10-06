"""seed initial interests

Revision ID: b14c89bddd51
Revises: 7d1cddbdac9c
Create Date: 2026-10-06 04:07:00.410871

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b14c89bddd51'
down_revision: Union[str, Sequence[str], None] = '7d1cddbdac9c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    interests_table = sa.table(
        "interests",
        sa.column("name", sa.String),
    )

    op.bulk_insert(
        interests_table,
        [
            {"name": "Nature"},
            {"name": "Adventure"},
            {"name": "Trekking"},
            {"name": "Beach"},
            {"name": "Wildlife"},
            {"name": "History"},
            {"name": "Culture"},
            {"name": "Food"},
            {"name": "Photography"},
            {"name": "Relaxation"},
            {"name": "Camping"},
            {"name": "Water Sports"},
        ],
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            DELETE FROM interests
            WHERE name IN (
                'Nature',
                'Adventure',
                'Trekking',
                'Beach',
                'Wildlife',
                'History',
                'Culture',
                'Food',
                'Photography',
                'Relaxation',
                'Camping',
                'Water Sports'
            )
            """
        )
    )
