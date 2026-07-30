"""merge_profile_fields_and_main

Revision ID: 159a4545b89b
Revises: 20260727_profile_fields, 001122334455
Create Date: 2026-07-27 22:34:50.987201+07:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '159a4545b89b'
down_revision: Union[str, None] = ('20260727_profile_fields', '001122334455')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
