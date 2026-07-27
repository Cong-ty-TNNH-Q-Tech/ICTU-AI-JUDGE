"""Add github_url linkedin_url avatar_url to users

Revision ID: 20260727_profile_fields
Revises: 20260727_1400_3f8a1c2e9d45_add_solution_upvotes_table
Create Date: 2026-07-27 19:15:00

Issue #30: Feature Hồ sơ cá nhân — thêm 3 trường profile vào bảng users.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "20260727_profile_fields"
down_revision = "173a4b9c8d2e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("github_url", sa.String(500), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("linkedin_url", sa.String(500), nullable=True),
    )
    op.add_column(
        "users",
        # Lưu S3 key (không phải presigned URL — URL có TTL, sẽ expire)
        sa.Column("avatar_url", sa.String(1000), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "linkedin_url")
    op.drop_column("users", "github_url")
