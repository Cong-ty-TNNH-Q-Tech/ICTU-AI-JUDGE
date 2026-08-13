"""add EXPIRED to invite_status_enum

Revision ID: a1b2c3d4e5f6
Revises: 354e9afefb67
Create Date: 2026-07-30 10:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '354e9afefb67'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ALTER TYPE ... ADD VALUE không chạy được trong transaction
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE invite_status_enum ADD VALUE IF NOT EXISTS 'EXPIRED'")


def downgrade() -> None:
    # PostgreSQL không hỗ trợ remove value từ enum type, downgrade là no-op
    pass
