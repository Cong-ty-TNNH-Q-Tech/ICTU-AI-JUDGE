"""add max_team_size

Revision ID: 17dc37a4b222
Revises: 173a4b9c8d2e
Create Date: 2026-07-27 19:44:15.028055+07:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '17dc37a4b222'
down_revision: Union[str, None] = '173a4b9c8d2e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('challenges', sa.Column('max_team_size', sa.Integer(), nullable=False, server_default='5'))


def downgrade() -> None:
    op.drop_column('challenges', 'max_team_size')
