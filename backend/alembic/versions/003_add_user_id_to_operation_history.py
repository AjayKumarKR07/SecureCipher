"""add_user_id_to_operation_history

Revision ID: 003_user_history
Revises: 4013954a5376
Create Date: 2026-10-18 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003_user_history'
down_revision: Union[str, Sequence[str], None] = '4013954a5376'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Safely adds user_id foreign key column to operation_history.
    Preserves all existing audit records by setting user_id nullable.
    """
    conn = op.get_bind()
    insp = sa.inspect(conn)
    columns = [c['name'] for c in insp.get_columns('operation_history')]

    if 'user_id' not in columns:
        op.add_column(
            'operation_history',
            sa.Column(
                'user_id',
                sa.Integer(),
                sa.ForeignKey('users.id', ondelete='CASCADE'),
                nullable=True,
            ),
        )
        op.create_index(
            op.f('ix_operation_history_user_id'),
            'operation_history',
            ['user_id'],
            unique=False,
        )


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    insp = sa.inspect(conn)
    columns = [c['name'] for c in insp.get_columns('operation_history')]

    if 'user_id' in columns:
        op.drop_index(op.f('ix_operation_history_user_id'), table_name='operation_history')
        op.drop_column('operation_history', 'user_id')
