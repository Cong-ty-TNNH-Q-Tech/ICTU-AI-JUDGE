"""Merge: add_parent_id_to_challenges + add_contests_table

Revision ID: c3d4e5f6a7b8
Revises: 5f6e7d8c9b0a, b89136e1d320
Create Date: 2026-08-01 13:00:00.000000+07:00

Merge migration: Hop nhat 2 nhanh migration song song:
- 5f6e7d8c9b0a: add parent_id to challenges (feat/124-contest-leaderboard - main PR #136)
- b89136e1d320: add contests table + contest_id to challenges (feat/issue-123-contest-entity)

Ca 2 migration deu bat dau tu a1b2c3d4e5f6 va khong co xung dot schema.
parent_id (self-referential) va contest_id (FK to contests) phuc vu muc dich khac nhau.
"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, tuple] = ('5f6e7d8c9b0a', 'b89136e1d320')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Merge migration - khong co schema thay doi bo sung.
    # Muc dich: hop nhat 2 heads thanh 1 de alembic upgrade head hoat dong.
    pass


def downgrade() -> None:
    # Merge migration - khong co schema thay doi bo sung.
    pass
