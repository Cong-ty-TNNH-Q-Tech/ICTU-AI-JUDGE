"""add password resets

Revision ID: password_resets_123
Revises: 
Create Date: 2026-08-02 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'password_resets_123'
down_revision: Union[str, None] = '5f6e7d8c9b0a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('password_resets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token', sa.String(length=100), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used', sa.Boolean(), nullable=False, server_default='false'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token')
    )
    op.create_index('ix_password_resets_token', 'password_resets', ['token'], unique=False)
    op.create_index('ix_password_resets_user_id', 'password_resets', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_password_resets_user_id', table_name='password_resets')
    op.drop_index('ix_password_resets_token', table_name='password_resets')
    op.drop_table('password_resets')
