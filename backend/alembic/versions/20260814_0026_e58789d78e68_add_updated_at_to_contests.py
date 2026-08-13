"""add updated_at to contests

Revision ID: e58789d78e68
Revises: f2fbe3d4c86d
Create Date: 2026-08-14 00:26:38.283481+07:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e58789d78e68'
down_revision: Union[str, None] = 'f2fbe3d4c86d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('contests', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('contests', 'updated_at')
