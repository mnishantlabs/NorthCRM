from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.follow_up import FollowUpStatus
from app.models.user import User
from app.schemas.follow_up import (
    FollowUpCreate,
    FollowUpListResponse,
    FollowUpResponse,
    FollowUpStatusUpdate,
    FollowUpUpdate,
)
from app.services import follow_up as follow_up_service

router = APIRouter(prefix="/follow-ups", tags=["follow-ups"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get(
    "",
    response_model=FollowUpListResponse,
    summary="List follow-ups",
)
async def list_follow_ups(
    db: DbDep,
    current_user: CurrentUser,
    business_id: Annotated[uuid.UUID | None, Query()] = None,
    agent_id: Annotated[uuid.UUID | None, Query()] = None,
    followup_status: Annotated[
        FollowUpStatus | None,
        Query(alias="status", description="Filter by follow-up status"),
    ] = None,
    date_from: Annotated[datetime | None, Query()] = None,
    date_to: Annotated[datetime | None, Query()] = None,
    search: Annotated[str | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 20,
    sort_by: Annotated[str, Query()] = "followup_date",
    sort_order: Annotated[str, Query(pattern="^(asc|desc)$")] = "desc",
) -> FollowUpListResponse:
    filters = follow_up_service.FollowUpFilters(
        business_id=business_id,
        agent_id=agent_id,
        followup_status=followup_status,
        date_from=date_from,
        date_to=date_to,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return await follow_up_service.get_follow_ups(
        db, filters, current_user, page, per_page
    )


@router.get(
    "/today",
    response_model=list[FollowUpResponse],
    summary="List today's pending follow-ups",
)
async def list_today_follow_ups(
    db: DbDep, current_user: CurrentUser
) -> list[FollowUpResponse]:
    follow_ups = await follow_up_service.get_today_follow_ups(db, current_user)
    return [FollowUpResponse.model_validate(item) for item in follow_ups]


@router.get(
    "/{follow_up_id}",
    response_model=FollowUpResponse,
    summary="Get a single follow-up",
)
async def get_follow_up(
    db: DbDep, current_user: CurrentUser, follow_up_id: uuid.UUID
) -> FollowUpResponse:
    follow_up = await follow_up_service._get_follow_up(db, follow_up_id, current_user)
    return FollowUpResponse.model_validate(follow_up)


@router.post(
    "",
    response_model=FollowUpResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a follow-up",
)
async def create_follow_up(
    db: DbDep, current_user: CurrentUser, payload: FollowUpCreate
) -> FollowUpResponse:
    follow_up = await follow_up_service.create_follow_up(db, payload, current_user)
    return FollowUpResponse.model_validate(follow_up)


@router.put(
    "/{follow_up_id}",
    response_model=FollowUpResponse,
    summary="Update a follow-up",
)
async def update_follow_up(
    db: DbDep,
    current_user: CurrentUser,
    follow_up_id: uuid.UUID,
    payload: FollowUpUpdate,
) -> FollowUpResponse:
    follow_up = await follow_up_service.update_follow_up(
        db, follow_up_id, payload, current_user
    )
    return FollowUpResponse.model_validate(follow_up)


@router.patch(
    "/{follow_up_id}/status",
    response_model=FollowUpResponse,
    summary="Update a follow-up status",
)
async def update_follow_up_status(
    db: DbDep,
    current_user: CurrentUser,
    follow_up_id: uuid.UUID,
    payload: FollowUpStatusUpdate,
) -> FollowUpResponse:
    follow_up = await follow_up_service.update_status(
        db, follow_up_id, payload.status, current_user
    )
    return FollowUpResponse.model_validate(follow_up)


@router.delete(
    "/{follow_up_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a follow-up",
)
async def delete_follow_up(
    db: DbDep, current_user: CurrentUser, follow_up_id: uuid.UUID
):
    await follow_up_service.delete_follow_up(db, follow_up_id, current_user)
    return None
