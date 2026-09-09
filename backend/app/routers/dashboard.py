from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.dashboard import (
    AgentPerformance,
    CallsPerDay,
    DashboardStats,
    LeadStatus,
    SalesData,
)
from app.schemas.follow_up import FollowUpResponse
from app.services import dashboard as dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get(
    "/stats",
    response_model=DashboardStats,
    summary="Get dashboard summary statistics",
)
async def get_stats(db: DbDep, current_user: CurrentUser) -> DashboardStats:
    return await dashboard_service.get_stats(db, current_user)


@router.get(
    "/charts/calls-per-day",
    response_model=list[CallsPerDay],
    summary="Get calls per day chart data",
)
async def get_calls_per_day(
    db: DbDep, current_user: CurrentUser, days: int = Query(default=30, ge=1, le=365)
) -> list[CallsPerDay]:
    return await dashboard_service.get_calls_per_day(db, days)


@router.get(
    "/charts/agent-performance",
    response_model=list[AgentPerformance],
    summary="Get agent performance chart data",
)
async def get_agent_performance(
    db: DbDep, current_user: CurrentUser
) -> list[AgentPerformance]:
    return await dashboard_service.get_agent_performance(db)


@router.get(
    "/charts/sales",
    response_model=list[SalesData],
    summary="Get monthly sales chart data",
)
async def get_sales_data(
    db: DbDep,
    current_user: CurrentUser,
    months: int = Query(default=12, ge=1, le=60),
) -> list[SalesData]:
    return await dashboard_service.get_sales_data(db, months)


@router.get(
    "/charts/lead-status",
    response_model=list[LeadStatus],
    summary="Get lead status distribution chart data",
)
async def get_lead_status(
    db: DbDep, current_user: CurrentUser
) -> list[LeadStatus]:
    return await dashboard_service.get_lead_status_distribution(db)


@router.get(
    "/upcoming-followups",
    response_model=list[FollowUpResponse],
    summary="Get upcoming follow-ups",
)
async def get_upcoming_followups(
    db: DbDep,
    current_user: CurrentUser,
    limit: int = Query(default=10, ge=1, le=100),
) -> list[FollowUpResponse]:
    follow_ups = await dashboard_service.get_upcoming_followups(db, limit)
    return [FollowUpResponse.model_validate(item) for item in follow_ups]
