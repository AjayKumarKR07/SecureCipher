"""initial operation history

Revision ID: 001_initial
Revises: 
Create Date: 2026-10-11 22:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'operation_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('algorithm_name', sa.String(length=50), nullable=False),
        sa.Column('operation_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='success'),
        sa.Column('execution_duration_ms', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_operation_history_id'), 'operation_history', ['id'], unique=False)
    op.create_index(op.f('ix_operation_history_algorithm_name'), 'operation_history', ['algorithm_name'], unique=False)
    op.create_index(op.f('ix_operation_history_operation_type'), 'operation_history', ['operation_type'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_operation_history_operation_type'), table_name='operation_history')
    op.drop_index(op.f('ix_operation_history_algorithm_name'), table_name='operation_history')
    op.drop_index(op.f('ix_operation_history_id'), table_name='operation_history')
    op.drop_table('operation_history')
