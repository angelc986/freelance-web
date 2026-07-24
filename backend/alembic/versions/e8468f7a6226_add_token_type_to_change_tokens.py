"""add_token_type_to_change_tokens

Revision ID: e8468f7a6226
Revises: a4c4ca42cda7
Create Date: 2026-07-24 00:46:59.894232

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e8468f7a6226'
down_revision: Union[str, Sequence[str], None] = 'a4c4ca42cda7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add column as nullable first (existing rows have no value)
    op.add_column(
        'change_tokens',
        sa.Column(
            'token_type',
            sa.String(),
            nullable=True,
            comment='PASSWORD_RESET | EMAIL_CHANGE | PHONE_CHANGE | WALLET_CHANGE',
        ),
    )

    # Backfill existing rows with inferred token types
    # If new_email is set -> EMAIL_CHANGE, new_phone -> PHONE_CHANGE, new_wallet -> WALLET_CHANGE
    op.execute(
        "UPDATE change_tokens "
        "SET token_type = 'EMAIL_CHANGE' "
        "WHERE new_email IS NOT NULL AND token_type IS NULL"
    )
    op.execute(
        "UPDATE change_tokens "
        "SET token_type = 'PHONE_CHANGE' "
        "WHERE new_phone IS NOT NULL AND token_type IS NULL"
    )
    op.execute(
        "UPDATE change_tokens "
        "SET token_type = 'WALLET_CHANGE' "
        "WHERE new_wallet IS NOT NULL AND token_type IS NULL"
    )
    # Default for any remaining rows
    op.execute(
        "UPDATE change_tokens "
        "SET token_type = 'PASSWORD_RESET' "
        "WHERE token_type IS NULL"
    )

    # Now make it NOT NULL
    op.alter_column('change_tokens', 'token_type', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('change_tokens', 'token_type')
