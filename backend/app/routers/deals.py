from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.deal import DealStatus
from app.models.user import User
from app.schemas.deal import (
    DealCreate,
    DealListResponse,
    DealResponse,
    DealStatusUpdate,
    DealUpdate,
)
from app.services import deal as deal_service

router = APIRouter(prefix="/deals", tags=["deals"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get(
    "",
    response_model=DealListResponse,
    summary="List deals",
)
async def list_deals(
    db: DbDep,
    current_user: CurrentUser,
    business_id: Annotated[uuid.UUID | None, Query()] = None,
    service_id: Annotated[uuid.UUID | None, Query()] = None,
    deal_status: Annotated[
        DealStatus | None, Query(alias="status", description="Filter by deal status")
    ] = None,
    date_from: Annotated[datetime | None, Query()] = None,
    date_to: Annotated[datetime | None, Query()] = None,
    search: Annotated[str | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 20,
    sort_by: Annotated[str, Query()] = "created_at",
    sort_order: Annotated[str, Query(pattern="^(asc|desc)$")] = "desc",
) -> DealListResponse:
    filters = deal_service.DealFilters(
        business_id=business_id,
        service_id=service_id,
        deal_status=deal_status,
        date_from=date_from,
        date_to=date_to,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return await deal_service.get_deals(db, filters, current_user, page, per_page)


@router.get(
    "/{deal_id}",
    response_model=DealResponse,
    summary="Get a single deal",
)
async def get_deal(
    db: DbDep, current_user: CurrentUser, deal_id: uuid.UUID
) -> DealResponse:
    deal = await deal_service.get_deal(db, deal_id, current_user)
    return DealResponse.model_validate(deal)


@router.post(
    "",
    response_model=DealResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a deal",
)
async def create_deal(
    db: DbDep, current_user: CurrentUser, payload: DealCreate
) -> DealResponse:
    deal = await deal_service.create_deal(db, payload, current_user)
    return DealResponse.model_validate(deal)


@router.put(
    "/{deal_id}",
    response_model=DealResponse,
    summary="Update a deal",
)
async def update_deal(
    db: DbDep,
    current_user: CurrentUser,
    deal_id: uuid.UUID,
    payload: DealUpdate,
) -> DealResponse:
    deal = await deal_service.update_deal(db, deal_id, payload, current_user)
    return DealResponse.model_validate(deal)


@router.patch(
    "/{deal_id}/status",
    response_model=DealResponse,
    summary="Update a deal status",
)
async def update_deal_status(
    db: DbDep,
    current_user: CurrentUser,
    deal_id: uuid.UUID,
    payload: DealStatusUpdate,
) -> DealResponse:
    deal = await deal_service.update_status(db, deal_id, payload.status, current_user)
    return DealResponse.model_validate(deal)


@router.delete(
    "/{deal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a deal",
)
async def delete_deal(db: DbDep, current_user: CurrentUser, deal_id: uuid.UUID):
    await deal_service.delete_deal(db, deal_id, current_user)
    return None
