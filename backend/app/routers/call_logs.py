from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, require_admin
from app.models.business import BusinessStatus
from app.models.user import User
from app.schemas.call_log import (
    CallLogCreate,
    CallLogListResponse,
    CallLogResponse,
)
from app.services import call_log as call_log_service

router = APIRouter(prefix="/call-logs", tags=["call-logs"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(require_admin())]


@router.get(
    "",
    response_model=CallLogListResponse,
    summary="List call logs",
)
async def list_call_logs(
    db: DbDep,
    current_user: CurrentUser,
    business_id: Annotated[uuid.UUID | None, Query()] = None,
    agent_id: Annotated[uuid.UUID | None, Query()] = None,
    call_result: Annotated[BusinessStatus | None, Query()] = None,
    date_from: Annotated[datetime | None, Query()] = None,
    date_to: Annotated[datetime | None, Query()] = None,
    search: Annotated[str | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 20,
    sort_by: Annotated[str, Query()] = "call_date",
    sort_order: Annotated[str, Query(pattern="^(asc|desc)$")] = "desc",
) -> CallLogListResponse:
    filters = call_log_service.CallLogFilters(
        business_id=business_id,
        agent_id=agent_id,
        call_result=call_result,
        date_from=date_from,
        date_to=date_to,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return await call_log_service.get_call_logs(db, filters, current_user, page, per_page)


@router.get(
    "/business/{business_id}",
    response_model=list[CallLogResponse],
    summary="List call logs for a business",
)
async def list_business_call_logs(
    db: DbDep, current_user: CurrentUser, business_id: uuid.UUID
) -> list[CallLogResponse]:
    business = await call_log_service.get_business_call_logs(db, business_id)
    return [CallLogResponse.model_validate(log) for log in business]


@router.get(
    "/agent/{agent_id}",
    response_model=list[CallLogResponse],
    summary="List call logs for an agent (admin only)",
)
async def list_agent_call_logs(
    db: DbDep, admin: AdminUser, agent_id: uuid.UUID
) -> list[CallLogResponse]:
    logs = await call_log_service.get_agent_call_logs(db, agent_id)
    return [CallLogResponse.model_validate(log) for log in logs]


@router.get(
    "/{call_log_id}",
    response_model=CallLogResponse,
    summary="Get a single call log",
)
async def get_call_log(
    db: DbDep, current_user: CurrentUser, call_log_id: uuid.UUID
) -> CallLogResponse:
    log = await call_log_service.get_call_log(db, call_log_id)
    return CallLogResponse.model_validate(log)


@router.post(
    "",
    response_model=CallLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a call log",
)
async def create_call_log(
    db: DbDep, current_user: CurrentUser, payload: CallLogCreate
) -> CallLogResponse:
    log = await call_log_service.create_call_log(db, payload, current_user)
    return CallLogResponse.model_validate(log)
