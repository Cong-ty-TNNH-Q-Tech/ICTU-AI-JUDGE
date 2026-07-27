"""add_solution_upvotes_table

Revision ID: 3f8a1c2e9d45
Revises: 112fa9d5e069
Create Date: 2026-07-27 14:00:00.000000+07:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f8a1c2e9d45'
down_revision: Union[str, None] = '112fa9d5e069'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'solution_upvotes',
        sa.Column('solution_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['solution_id'], ['solutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('solution_id', 'user_id'),
    )
    op.create_index('ix_solution_upvotes_solution_id', 'solution_upvotes', ['solution_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_solution_upvotes_solution_id', table_name='solution_upvotes')
    op.drop_table('solution_upvotes')
