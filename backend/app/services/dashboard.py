from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.business import Business, BusinessStatus
from app.models.call_log import CallLog
from app.models.deal import Deal, DealStatus
from app.models.follow_up import FollowUp, FollowUpStatus
from app.models.user import User, UserRole
from app.schemas.dashboard import (
    AgentPerformance,
    CallsPerDay,
    DashboardStats,
    LeadStatus,
    SalesData,
)

_PENDING_STATUSES = (
    BusinessStatus.NEW,
    BusinessStatus.NO_ANSWER,
    BusinessStatus.BUSY,
)

_COMPLETED_STATUSES = (
    BusinessStatus.CALLED,
    BusinessStatus.INTERESTED,
    BusinessStatus.NOT_INTERESTED,
    BusinessStatus.CALLBACK,
    BusinessStatus.MEETING_SCHEDULED,
    BusinessStatus.PROPOSAL_SENT,
    BusinessStatus.CLOSED_WON,
    BusinessStatus.CLOSED_LOST,
)

_INTERESTED_STATUSES = (
    BusinessStatus.INTERESTED,
    BusinessStatus.MEETING_SCHEDULED,
    BusinessStatus.PROPOSAL_SENT,
)


def _start_of_day(value: datetime | None = None) -> datetime:
    now = value or datetime.now(UTC)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _start_of_month(value: datetime | None = None) -> datetime:
    now = value or datetime.now(UTC)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


async def get_stats(db: AsyncSession, user: User) -> DashboardStats:
    now = datetime.now(UTC)
    today_start = _start_of_day(now)
    month_start = _start_of_month(now)

    scope = Business.assigned_agent_id == user.id if user.role != UserRole.ADMIN else None

    def scoped(stmt):
        if scope is not None:
            stmt = stmt.where(scope)
        return stmt

    async def count_businesses(conditions: list) -> int:
        stmt = select(func.count(Business.id)).where(*conditions)
        return (await db.scalar(scoped(stmt))) or 0

    today_calls_stmt = select(func.count(CallLog.id)).where(
        CallLog.call_date >= today_start
    )
    if user.role != UserRole.ADMIN:
        today_calls_stmt = today_calls_stmt.where(CallLog.agent_id == user.id)
    today_calls = (await db.scalar(today_calls_stmt)) or 0

    pending_calls = await count_businesses([Business.status.in_(_PENDING_STATUSES)])
    completed_calls = await count_businesses([Business.status.in_(_COMPLETED_STATUSES)])
    interested_clients = await count_businesses(
        [Business.status.in_(_INTERESTED_STATUSES)]
    )
    callbacks_today = await count_businesses(
        [Business.status == BusinessStatus.CALLBACK, Business.updated_at >= today_start]
    )

    deal_stmt = (
        select(func.count(Deal.id), func.coalesce(func.sum(Deal.estimated_value), 0))
        .where(Deal.status == DealStatus.CLOSED_WON, Deal.updated_at >= month_start)
    )
    if user.role != UserRole.ADMIN:
        deal_stmt = deal_stmt.join(Business, Business.id == Deal.business_id).where(
            Business.assigned_agent_id == user.id
        )
    deal_row = (await db.execute(deal_stmt)).one()
    deals_closed = int(deal_row[0] or 0)
    revenue = Decimal(deal_row[1] or 0)

    return DashboardStats(
        today_calls=today_calls,
        pending_calls=pending_calls,
        completed_calls=completed_calls,
        interested_clients=interested_clients,
        callbacks_today=callbacks_today,
        deals_closed=deals_closed,
        revenue=revenue,
        monthly_sales=revenue,
    )


async def get_calls_per_day(
    db: AsyncSession, days: int = 30
) -> list[CallsPerDay]:
    days = max(1, days)
    today = datetime.now(UTC)
    start = _start_of_day(today) - timedelta(days=days - 1)

    day_expr = func.date(CallLog.call_date)
    result = await db.execute(
        select(day_expr, func.count(CallLog.id))
        .where(CallLog.call_date >= start)
        .group_by(day_expr)
    )
    counts = {str(row[0])[:10]: int(row[1]) for row in result.all()}

    items: list[CallsPerDay] = []
    cursor = start.date()
    today_date = today.date()
    while cursor <= today_date:
        items.append(CallsPerDay(date=cursor, count=counts.get(cursor.isoformat(), 0)))
        cursor += timedelta(days=1)
    return items


async def get_agent_performance(
    db: AsyncSession,
) -> list[AgentPerformance]:
    agents = list(
        (
            await db.scalars(
                select(User).where(
                    User.role == UserRole.AGENT, User.is_active.is_(True)
                )
            )
        ).all()
    )

    call_stmt = await db.execute(
        select(CallLog.agent_id, func.count(CallLog.id)).group_by(CallLog.agent_id)
    )
    call_counts = {row[0]: int(row[1]) for row in call_stmt.all()}

    deal_stmt = await db.execute(
        select(
            Business.assigned_agent_id,
            func.count(Deal.id),
            func.coalesce(func.sum(Deal.estimated_value), 0),
        )
        .join(Deal, Deal.business_id == Business.id)
        .where(
            Deal.status == DealStatus.CLOSED_WON,
            Business.assigned_agent_id.is_not(None),
        )
        .group_by(Business.assigned_agent_id)
    )
    deal_stats = {
        row[0]: (int(row[1]), Decimal(row[2] or 0)) for row in deal_stmt.all()
    }

    items = []
    for agent in agents:
        deals_closed, revenue = deal_stats.get(
            agent.id, (0, Decimal("0.00"))
        )
        items.append(
            AgentPerformance(
                agent_id=agent.id,
                agent_name=agent.name,
                calls_count=call_counts.get(agent.id, 0),
                deals_closed=deals_closed,
                revenue=revenue,
            )
        )
    return items


async def get_sales_data(
    db: AsyncSession, months: int = 12
) -> list[SalesData]:
    months = max(1, months)
    today = datetime.now(UTC)
    current_start = _start_of_month(today)

    start = current_start
    for _ in range(months - 1):
        previous = start - timedelta(days=1)
        start = previous.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    dialect = db.get_bind().dialect.name
    if dialect == "postgresql":
        month_expr = func.to_char(func.date_trunc("month", Deal.updated_at), "YYYY-MM")
    else:
        month_expr = func.strftime("%Y-%m", Deal.updated_at)

    result = await db.execute(
        select(month_expr, func.coalesce(func.sum(Deal.estimated_value), 0))
        .where(Deal.status == DealStatus.CLOSED_WON, Deal.updated_at >= start)
        .group_by(month_expr)
        .order_by(month_expr.asc())
    )
    revenue_by_month = {
        str(row[0]): Decimal(row[1] or 0) for row in result.all()
    }

    items: list[SalesData] = []
    bucket = start
    while bucket <= current_start:
        key = bucket.strftime("%Y-%m")
        items.append(
            SalesData(month=key, revenue=revenue_by_month.get(key, Decimal("0.00")))
        )
        next_month = bucket.replace(day=28) + timedelta(days=4)
        bucket = next_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return items


async def get_lead_status_distribution(
    db: AsyncSession,
) -> list[LeadStatus]:
    result = await db.execute(
        select(Business.status, func.count(Business.id))
        .group_by(Business.status)
        .order_by(func.count(Business.id).desc())
    )
    return [
        LeadStatus(status=row[0].value, count=int(row[1])) for row in result.all()
    ]


async def get_upcoming_followups(
    db: AsyncSession, limit: int = 10
) -> list[FollowUp]:
    now = datetime.now(UTC)
    result = await db.execute(
        select(FollowUp)
        .where(
            FollowUp.followup_date >= now,
            FollowUp.status == FollowUpStatus.PENDING,
        )
        .options(selectinload(FollowUp.business), selectinload(FollowUp.agent))
        .order_by(FollowUp.followup_date.asc())
        .limit(max(1, limit))
    )
    return list(result.scalars().all())
