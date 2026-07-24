"""add_avatar_verified_url

Revision ID: 692ae782975e
Revises: e8468f7a6226
Create Date: 2026-07-24 03:53:55.348786

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '692ae782975e'
down_revision: Union[str, Sequence[str], None] = 'e8468f7a6226'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('avatar_verified_url', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'avatar_verified_url')
