"""make end_time nullable

Revision ID: 354e9afefb67
Revises: 88f673c4a16a
Create Date: 2026-07-29 12:18:00.254427+07:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '354e9afefb67'
down_revision: Union[str, None] = '88f673c4a16a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('challenges', 'end_time',
               existing_type=sa.DateTime(timezone=True),
               nullable=True)


def downgrade() -> None:
    op.alter_column('challenges', 'end_time',
               existing_type=sa.DateTime(timezone=True),
               nullable=False)
