"""initial_crm_schema

Revision ID: 0001
Revises:
Create Date: 2026-01-01 00:00:00.000000

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial_crm_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ------------------------------------------------------------
    # ENUM types
    # ------------------------------------------------------------
    user_role = sa.Enum("admin", "agent", name="user_role")
    business_status = sa.Enum(
        "new",
        "called",
        "busy",
        "interested",
        "not_interested",
        "no_answer",
        "callback",
        "meeting_scheduled",
        "proposal_sent",
        "closed_won",
        "closed_lost",
        "spam",
        name="business_status",
    )
    follow_up_status = sa.Enum(
        "pending", "completed", "missed", "cancelled", name="follow_up_status"
    )
    deal_status = sa.Enum(
        "prospect", "negotiation", "proposal", "closed_won", "closed_lost",
        name="deal_status",
    )

    user_role.create(op.get_bind(), checkfirst=True)
    business_status.create(op.get_bind(), checkfirst=True)
    follow_up_status.create(op.get_bind(), checkfirst=True)
    deal_status.create(op.get_bind(), checkfirst=True)

    # ------------------------------------------------------------
    # users
    # ------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            postgresql.ENUM(name="user_role", create_type=False),
            nullable=False,
            server_default="agent",
        ),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_role", "users", ["role"])

    # ------------------------------------------------------------
    # services
    # ------------------------------------------------------------
    op.create_table(
        "services",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_services_name", "services", ["name"])

    # ------------------------------------------------------------
    # businesses
    # ------------------------------------------------------------
    op.create_table(
        "businesses",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("business_name", sa.String(length=255), nullable=False),
        sa.Column("owner_name", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("website", sa.String(length=500), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("state", sa.String(length=100), nullable=True),
        sa.Column("country", sa.String(length=100), nullable=True, server_default="India"),
        sa.Column("google_maps_url", sa.String(length=500), nullable=True),
        sa.Column("category", sa.String(length=255), nullable=True),
        sa.Column(
            "assigned_agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "status",
            postgresql.ENUM(name="business_status", create_type=False),
            nullable=False,
            server_default="new",
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_businesses_business_name", "businesses", ["business_name"])
    op.create_index("ix_businesses_phone", "businesses", ["phone"])
    op.create_index("ix_businesses_email", "businesses", ["email"])
    op.create_index("ix_businesses_category", "businesses", ["category"])
    op.create_index("ix_businesses_status", "businesses", ["status"])
    op.create_index("ix_businesses_assigned_agent_id", "businesses", ["assigned_agent_id"])
    op.create_index("ix_businesses_created_at", "businesses", ["created_at"])

    # ------------------------------------------------------------
    # call_logs
    # ------------------------------------------------------------
    op.create_table(
        "call_logs",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "business_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("businesses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "call_date",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("duration", sa.Integer(), nullable=True),
        sa.Column(
            "call_result",
            postgresql.ENUM(name="business_status", create_type=False),
            nullable=False,
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_call_logs_business_id", "call_logs", ["business_id"])
    op.create_index("ix_call_logs_agent_id", "call_logs", ["agent_id"])
    op.create_index("ix_call_logs_call_date", "call_logs", ["call_date"])

    # ------------------------------------------------------------
    # follow_ups
    # ------------------------------------------------------------
    op.create_table(
        "follow_ups",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "business_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("businesses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("followup_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM(name="follow_up_status", create_type=False),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_follow_ups_business_id", "follow_ups", ["business_id"])
    op.create_index("ix_follow_ups_agent_id", "follow_ups", ["agent_id"])
    op.create_index("ix_follow_ups_followup_date", "follow_ups", ["followup_date"])
    op.create_index("ix_follow_ups_status", "follow_ups", ["status"])

    # ------------------------------------------------------------
    # deals
    # ------------------------------------------------------------
    op.create_table(
        "deals",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "business_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("businesses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "service_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("services.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("estimated_value", sa.Numeric(12, 2), nullable=True),
        sa.Column("closing_probability", sa.Integer(), nullable=True),
        sa.Column(
            "status",
            postgresql.ENUM(name="deal_status", create_type=False),
            nullable=False,
            server_default="prospect",
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "closing_probability >= 0 AND closing_probability <= 100",
            name="ck_deals_closing_probability_range",
        ),
    )
    op.create_index("ix_deals_business_id", "deals", ["business_id"])
    op.create_index("ix_deals_status", "deals", ["status"])
    op.create_index("ix_deals_service_id", "deals", ["service_id"])

    # ------------------------------------------------------------
    # business_services (associative table)
    # ------------------------------------------------------------
    op.create_table(
        "business_services",
        sa.Column(
            "business_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("businesses.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "service_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("services.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )
    op.create_index(
        "ix_business_services_service_id", "business_services", ["service_id"]
    )


def downgrade() -> None:
    op.drop_table("business_services")
    op.drop_table("deals")
    op.drop_table("follow_ups")
    op.drop_table("call_logs")
    op.drop_table("businesses")
    op.drop_table("services")
    op.drop_table("users")

    sa.Enum(name="deal_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="follow_up_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="business_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="user_role").drop(op.get_bind(), checkfirst=True)