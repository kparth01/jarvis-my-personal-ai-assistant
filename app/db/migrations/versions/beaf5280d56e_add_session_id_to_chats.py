"""add session_id to chats

Revision ID: beaf5280d56e
Revises: f5c98867f5a1
Create Date: 2026-07-19 04:42:11.427427

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'beaf5280d56e'
down_revision: Union[str, Sequence[str], None] = 'f5c98867f5a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('chats', 
        sa.Column('session_id', sa.String(255), nullable=True),
        schema='jarvis'
    )
    op.create_index('ix_jarvis_chats_session_id', 'chats', ['session_id'], schema='jarvis')

def downgrade() -> None:
    op.drop_index('ix_jarvis_chats_session_id', table_name='chats', schema='jarvis')
    op.drop_column('chats', 'session_id', schema='jarvis')

