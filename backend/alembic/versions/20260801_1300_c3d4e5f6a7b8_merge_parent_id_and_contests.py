"""Merge: add_parent_id_to_challenges + add_contests_table

Revision ID: c3d4e5f6a7b8
Revises: 5f6e7d8c9b0a, b89136e1d320
Create Date: 2026-08-01 13:00:00.000000+07:00

Merge migration: Hợp nhất 2 nhánh migration song song:
- 5f6e7d8c9b0a: add parent_id to challenges (feat/124-contest-leaderboard)
- b89136e1d320: add contests table + contest_id to challenges (feat/issue-123-contest-entity)

Cả 2 migration đều bắt đầu từ a1b2c3d4e5f6 và không có xung đột schema.
"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, tuple] = ('5f6e7d8c9b0a', 'b89136e1d320')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Merge migration — không có schema thay đổi bổ sung.
    # Mục đích: hợp nhất 2 heads thành 1 để alembic upgrade head hoạt động.
    pass


def downgrade() -> None:
    # Merge migration — không có schema thay đổi bổ sung.
    pass
