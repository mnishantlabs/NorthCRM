from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_admin
from app.models.user import User
from app.services import analytics as analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
AdminUser = Annotated[User, Depends(require_admin())]


class AnalyticsOverview(BaseModel):
    date_from: datetime
    date_to: datetime
    total_businesses: int
    new_businesses: int
    total_calls: int
    followups_completed: int
    interested_clients: int
    deals_closed: int
    revenue: Decimal


class FunnelStage(BaseModel):
    stage: str
    count: int


class RevenueByService(BaseModel):
    service_id: uuid.UUID | None
    service_name: str
    revenue: Decimal
    deals_closed: int


@router.get(
    "/overview",
    response_model=AnalyticsOverview,
    summary="Get analytics overview for a date range (admin only)",
)
async def get_overview(
    db: DbDep,
    admin: AdminUser,
    date_from: Annotated[datetime | None, Query()] = None,
    date_to: Annotated[datetime | None, Query()] = None,
) -> AnalyticsOverview:
    data = await analytics_service.get_overview(db, date_from, date_to)
    return AnalyticsOverview(**data)


@router.get(
    "/conversion-funnel",
    response_model=list[FunnelStage],
    summary="Get the sales conversion funnel (admin only)",
)
async def get_conversion_funnel(
    db: DbDep, admin: AdminUser
) -> list[FunnelStage]:
    data = await analytics_service.get_conversion_funnel(db)
    return [FunnelStage(**item) for item in data]


@router.get(
    "/revenue-by-service",
    response_model=list[RevenueByService],
    summary="Get revenue grouped by service (admin only)",
)
async def get_revenue_by_service(
    db: DbDep, admin: AdminUser
) -> list[RevenueByService]:
    data = await analytics_service.get_revenue_by_service(db)
    return [RevenueByService(**item) for item in data]
