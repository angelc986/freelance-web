"""add_kyc_status_and_webhook_events

Revision ID: c5059abe63f1
Revises: 692ae782975e
Create Date: 2026-07-24 03:59:13.460064

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5059abe63f1'
down_revision: Union[str, Sequence[str], None] = '692ae782975e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('kyc_webhook_events',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('session_id', sa.String(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('processed_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_kyc_webhook_events_id'), 'kyc_webhook_events', ['id'], unique=False)
    op.create_index(op.f('ix_kyc_webhook_events_session_id'), 'kyc_webhook_events', ['session_id'], unique=False)
    op.create_index(op.f('ix_kyc_webhook_events_user_id'), 'kyc_webhook_events', ['user_id'], unique=False)
    op.add_column('users', sa.Column('kyc_status', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'kyc_status')
    op.drop_index(op.f('ix_kyc_webhook_events_user_id'), table_name='kyc_webhook_events')
    op.drop_index(op.f('ix_kyc_webhook_events_session_id'), table_name='kyc_webhook_events')
    op.drop_index(op.f('ix_kyc_webhook_events_id'), table_name='kyc_webhook_events')
    op.drop_table('kyc_webhook_events')
