from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.business import Business, BusinessStatus
from app.models.call_log import CallLog
from app.models.deal import Deal, DealStatus
from app.models.follow_up import FollowUp, FollowUpStatus
from app.models.service import Service

_INTERESTED_STATUSES = (
    BusinessStatus.INTERESTED,
    BusinessStatus.MEETING_SCHEDULED,
    BusinessStatus.PROPOSAL_SENT,
    BusinessStatus.CLOSED_WON,
)

_CALLED_STATUSES = (
    BusinessStatus.CALLED,
    BusinessStatus.INTERESTED,
    BusinessStatus.NOT_INTERESTED,
    BusinessStatus.NO_ANSWER,
    BusinessStatus.CALLBACK,
    BusinessStatus.MEETING_SCHEDULED,
    BusinessStatus.PROPOSAL_SENT,
    BusinessStatus.CLOSED_WON,
    BusinessStatus.CLOSED_LOST,
    BusinessStatus.SPAM,
)


def _ensure_aware(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value


def _start_of_month(value: datetime | None = None) -> datetime:
    now = value or datetime.now(UTC)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


async def get_overview(
    db: AsyncSession, date_from: datetime | None, date_to: datetime | None
) -> dict:
    now = datetime.now(UTC)
    start = _ensure_aware(date_from) or _start_of_month(now)
    end = _ensure_aware(date_to) or now
    if end < start:
        start, end = end, start

    total_businesses = (await db.scalar(select(func.count(Business.id)))) or 0
    new_businesses = (
        await db.scalar(
            select(func.count(Business.id)).where(
                Business.created_at >= start, Business.created_at <= end
            )
        )
    ) or 0
    total_calls = (
        await db.scalar(
            select(func.count(CallLog.id)).where(
                CallLog.call_date >= start, CallLog.call_date <= end
            )
        )
    ) or 0
    followups_completed = (
        await db.scalar(
            select(func.count(FollowUp.id)).where(
                FollowUp.status == FollowUpStatus.COMPLETED,
                FollowUp.followup_date >= start,
                FollowUp.followup_date <= end,
            )
        )
    ) or 0
    interested_clients = (
        await db.scalar(
            select(func.count(Business.id)).where(
                Business.status.in_(_INTERESTED_STATUSES)
            )
        )
    ) or 0

    deal_row = (
        await db.execute(
            select(
                func.count(Deal.id),
                func.coalesce(func.sum(Deal.estimated_value), 0),
            ).where(
                Deal.status == DealStatus.CLOSED_WON,
                Deal.updated_at >= start,
                Deal.updated_at <= end,
            )
        )
    ).one()

    return {
        "date_from": start,
        "date_to": end,
        "total_businesses": total_businesses,
        "new_businesses": new_businesses,
        "total_calls": total_calls,
        "followups_completed": followups_completed,
        "interested_clients": interested_clients,
        "deals_closed": int(deal_row[0] or 0),
        "revenue": Decimal(deal_row[1] or 0),
    }


async def get_conversion_funnel(db: AsyncSession) -> list[dict]:
    total_leads = (await db.scalar(select(func.count(Business.id)))) or 0
    stages = [
        ("total_leads", (BusinessStatus.NEW,)),
        ("called", _CALLED_STATUSES),
        ("interested", _INTERESTED_STATUSES),
        (
            "meeting_scheduled",
            (
                BusinessStatus.MEETING_SCHEDULED,
                BusinessStatus.PROPOSAL_SENT,
                BusinessStatus.CLOSED_WON,
            ),
        ),
        (
            "proposal_sent",
            (BusinessStatus.PROPOSAL_SENT, BusinessStatus.CLOSED_WON),
        ),
        ("closed_won", (BusinessStatus.CLOSED_WON,)),
    ]

    funnel = [{"stage": stages[0][0], "count": total_leads}]
    for name, statuses in stages[1:]:
        count = (
            await db.scalar(
                select(func.count(Business.id)).where(Business.status.in_(statuses))
            )
        ) or 0
        funnel.append({"stage": name, "count": count})
    return funnel


async def get_revenue_by_service(db: AsyncSession) -> list[dict]:
    revenue_expr = func.coalesce(func.sum(Deal.estimated_value), 0)
    result = await db.execute(
        select(
            Service.id,
            Service.name,
            revenue_expr,
            func.count(Deal.id),
        )
        .outerjoin(
            Deal,
            and_(Deal.service_id == Service.id, Deal.status == DealStatus.CLOSED_WON),
        )
        .group_by(Service.id, Service.name)
        .order_by(revenue_expr.desc())
    )
    return [
        {
            "service_id": row[0],
            "service_name": row[1],
            "revenue": Decimal(row[2] or 0),
            "deals_closed": int(row[3] or 0),
        }
        for row in result.all()
    ]
