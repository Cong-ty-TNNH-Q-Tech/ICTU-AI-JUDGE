"""add parent_id to challenges

Revision ID: 5f6e7d8c9b0a
Revises: a1b2c3d4e5f6
Create Date: 2026-07-30 12:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5f6e7d8c9b0a'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('challenges', sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_challenges_parent_id', 'challenges', 'challenges', ['parent_id'], ['id'])
    op.create_index('ix_challenges_parent_id', 'challenges', ['parent_id'])


def downgrade() -> None:
    op.drop_index('ix_challenges_parent_id', table_name='challenges')
    op.drop_constraint('fk_challenges_parent_id', 'challenges', type_='foreignkey')
    op.drop_column('challenges', 'parent_id')
