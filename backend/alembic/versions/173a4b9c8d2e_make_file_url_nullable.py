"""make file_url nullable

Revision ID: 173a4b9c8d2e
Revises: 
Create Date: 2026-07-27 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '173a4b9c8d2e'
down_revision: Union[str, None] = '3f8a1c2e9d45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('submissions', 'file_url',
               existing_type=sa.VARCHAR(length=1000),
               nullable=True)


def downgrade() -> None:
    op.alter_column('submissions', 'file_url',
               existing_type=sa.VARCHAR(length=1000),
               nullable=False)
