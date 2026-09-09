from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import Select, and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.business import Business
from app.models.follow_up import FollowUp, FollowUpStatus
from app.models.user import User, UserRole
from app.schemas.follow_up import (
    FollowUpCreate,
    FollowUpListResponse,
    FollowUpResponse,
    FollowUpUpdate,
)


def _ensure_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value


def _end_of_day(value: datetime) -> datetime:
    if (
        value.hour == 0
        and value.minute == 0
        and value.second == 0
        and value.microsecond == 0
    ):
        return value.replace(hour=23, minute=59, second=59, microsecond=999999)
    return value


class FollowUpFilters:
    def __init__(
        self,
        business_id: uuid.UUID | None = None,
        agent_id: uuid.UUID | None = None,
        followup_status: FollowUpStatus | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        search: str | None = None,
        sort_by: str = "followup_date",
        sort_order: str = "desc",
    ):
        self.business_id = business_id
        self.agent_id = agent_id
        self.followup_status = followup_status
        self.date_from = date_from
        self.date_to = date_to
        self.search = search
        self.sort_by = sort_by
        self.sort_order = sort_order


_SORTABLE_COLUMNS = {
    "followup_date": FollowUp.followup_date,
    "created_at": FollowUp.created_at,
    "updated_at": FollowUp.updated_at,
    "status": FollowUp.status,
}


def _apply_filters(
    stmt: Select, filters: FollowUpFilters, user: User | None = None
) -> Select:
    conditions: list = []

    if user is not None and user.role != UserRole.ADMIN:
        conditions.append(FollowUp.agent_id == user.id)
    if filters.business_id is not None:
        conditions.append(FollowUp.business_id == filters.business_id)
    if filters.agent_id is not None:
        conditions.append(FollowUp.agent_id == filters.agent_id)
    if filters.followup_status is not None:
        conditions.append(FollowUp.status == filters.followup_status)
    if filters.date_from is not None:
        conditions.append(FollowUp.followup_date >= _ensure_aware(filters.date_from))
    if filters.date_to is not None:
        conditions.append(
            FollowUp.followup_date <= _end_of_day(_ensure_aware(filters.date_to))
        )
    if filters.search:
        stmt = stmt.join(Business, Business.id == FollowUp.business_id)
        conditions.append(Business.business_name.ilike(f"%{filters.search.strip()}%"))

    if conditions:
        stmt = stmt.where(and_(*conditions))
    return stmt


def _apply_sort(stmt: Select, filters: FollowUpFilters) -> Select:
    column = _SORTABLE_COLUMNS.get(filters.sort_by, FollowUp.followup_date)
    if filters.sort_order == "asc":
        return stmt.order_by(column.asc())
    return stmt.order_by(column.desc())


def _serialize(follow_up: FollowUp) -> FollowUpResponse:
    data = FollowUpResponse.model_validate(follow_up).model_dump()
    data["agent_name"] = follow_up.agent.name if follow_up.agent is not None else None
    data["business_name"] = (
        follow_up.business.business_name if follow_up.business is not None else None
    )
    return FollowUpResponse(**data)


async def get_follow_ups(
    db: AsyncSession,
    filters: FollowUpFilters,
    user: User | None = None,
    page: int = 1,
    per_page: int = 20,
) -> FollowUpListResponse:
    page = max(1, page)
    per_page = min(max(1, per_page), 100)

    base = select(FollowUp).options(
        selectinload(FollowUp.business), selectinload(FollowUp.agent)
    )
    filtered = _apply_filters(base, filters, user)

    count_stmt = _apply_filters(select(func.count(FollowUp.id)), filters, user)
    total = (await db.scalar(count_stmt)) or 0

    stmt = _apply_sort(filtered, filters).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(stmt)
    follow_ups = result.scalars().unique().all()

    items = [_serialize(follow_up) for follow_up in follow_ups]
    pages = (total + per_page - 1) // per_page if total else 0
    return FollowUpListResponse(
        items=items, total=total, page=page, per_page=per_page, pages=pages
    )


async def get_today_follow_ups(
    db: AsyncSession, user: User
) -> list[FollowUp]:
    now = datetime.now(UTC)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)

    stmt = (
        select(FollowUp)
        .where(
            FollowUp.followup_date >= start,
            FollowUp.followup_date < end,
            FollowUp.status == FollowUpStatus.PENDING,
        )
        .options(selectinload(FollowUp.business), selectinload(FollowUp.agent))
        .order_by(FollowUp.followup_date.asc())
    )
    if user.role != UserRole.ADMIN:
        stmt = stmt.where(FollowUp.agent_id == user.id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def _get_follow_up(
    db: AsyncSession, follow_up_id: uuid.UUID, user: User
) -> FollowUp:
    follow_up = (
        await db.execute(
            select(FollowUp)
            .where(FollowUp.id == follow_up_id)
            .options(selectinload(FollowUp.business), selectinload(FollowUp.agent))
        )
    ).scalar_one_or_none()
    if follow_up is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up not found",
        )
    if user.role != UserRole.ADMIN and follow_up.agent_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this follow-up",
        )
    return follow_up


async def create_follow_up(
    db: AsyncSession, data: FollowUpCreate, user: User
) -> FollowUp:
    business = await db.get(Business, data.business_id)
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found",
        )
    if user.role != UserRole.ADMIN and business.assigned_agent_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create follow-ups for this business",
        )

    follow_up = FollowUp(
        business_id=data.business_id,
        agent_id=user.id,
        followup_date=_ensure_aware(data.followup_date),
        notes=data.notes,
    )
    db.add(follow_up)
    await db.commit()
    return await _get_follow_up(db, follow_up.id, user)


async def update_follow_up(
    db: AsyncSession, follow_up_id: uuid.UUID, data: FollowUpUpdate, user: User
) -> FollowUp:
    follow_up = await _get_follow_up(db, follow_up_id, user)
    payload = data.model_dump(exclude_unset=True)
    if "followup_date" in payload and payload["followup_date"] is not None:
        payload["followup_date"] = _ensure_aware(payload["followup_date"])
    for field, value in payload.items():
        setattr(follow_up, field, value)
    await db.commit()
    return await _get_follow_up(db, follow_up_id, user)


async def update_status(
    db: AsyncSession, follow_up_id: uuid.UUID, followup_status: FollowUpStatus, user: User
) -> FollowUp:
    follow_up = await _get_follow_up(db, follow_up_id, user)
    follow_up.status = followup_status
    await db.commit()
    return await _get_follow_up(db, follow_up_id, user)


async def delete_follow_up(
    db: AsyncSession, follow_up_id: uuid.UUID, user: User
) -> None:
    follow_up = await _get_follow_up(db, follow_up_id, user)
    await db.delete(follow_up)
    await db.commit()
