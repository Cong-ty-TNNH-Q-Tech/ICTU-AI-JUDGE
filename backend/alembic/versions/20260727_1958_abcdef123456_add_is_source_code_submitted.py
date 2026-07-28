"""add is_source_code_submitted

Revision ID: abcdef123456
Revises: 17dc37a4b222
Create Date: 2026-07-27 19:58:00.000000+07:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'abcdef123456'
down_revision: Union[str, None] = '17dc37a4b222'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('leaderboard', sa.Column('is_source_code_submitted', sa.Boolean(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('leaderboard', 'is_source_code_submitted')
