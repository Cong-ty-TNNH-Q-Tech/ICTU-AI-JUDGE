"""Add contests table

Revision ID: b89136e1d320
Revises: a1b2c3d4e5f6
Create Date: 2026-07-31 22:25:23.031784+07:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b89136e1d320'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'contests',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'PUBLISHED', 'ARCHIVED', name='contest_status_enum'), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.add_column('challenges', sa.Column('contest_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'fk_challenges_contest_id', 'challenges', 'contests', ['contest_id'], ['id']
    )
    # Index de tranh Full Table Scan khi query GET /contests/{id}/challenges
    op.create_index('ix_challenges_contest_id', 'challenges', ['contest_id'])
    # Partial index: toi uu get_list va get_by_id filter WHERE deleted_at IS NULL
    # PostgreSQL partial index -- chi index active rows, nho hon, nhanh hon full index
    op.execute(
        "CREATE INDEX ix_contests_active ON contests (created_at DESC) WHERE deleted_at IS NULL"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_contests_active")
    op.drop_index('ix_challenges_contest_id', table_name='challenges')
    op.drop_constraint('fk_challenges_contest_id', 'challenges', type_='foreignkey')
    op.drop_column('challenges', 'contest_id')
    op.drop_table('contests')
    op.execute("DROP TYPE IF EXISTS contest_status_enum")
