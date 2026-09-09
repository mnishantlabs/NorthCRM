from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import Select, and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.business import Business, BusinessStatus
from app.models.call_log import CallLog
from app.models.user import User, UserRole
from app.schemas.call_log import CallLogCreate, CallLogListResponse, CallLogResponse


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


class CallLogFilters:
    def __init__(
        self,
        business_id: uuid.UUID | None = None,
        agent_id: uuid.UUID | None = None,
        call_result: BusinessStatus | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        search: str | None = None,
        sort_by: str = "call_date",
        sort_order: str = "desc",
    ):
        self.business_id = business_id
        self.agent_id = agent_id
        self.call_result = call_result
        self.date_from = date_from
        self.date_to = date_to
        self.search = search
        self.sort_by = sort_by
        self.sort_order = sort_order


_SORTABLE_COLUMNS = {
    "call_date": CallLog.call_date,
    "created_at": CallLog.created_at,
    "updated_at": CallLog.updated_at,
    "duration": CallLog.duration,
}


def _apply_filters(
    stmt: Select, filters: CallLogFilters, user: User | None = None
) -> Select:
    conditions: list = []

    if user is not None and user.role != UserRole.ADMIN:
        conditions.append(CallLog.agent_id == user.id)
    if filters.business_id is not None:
        conditions.append(CallLog.business_id == filters.business_id)
    if filters.agent_id is not None:
        conditions.append(CallLog.agent_id == filters.agent_id)
    if filters.call_result is not None:
        conditions.append(CallLog.call_result == filters.call_result)
    if filters.date_from is not None:
        conditions.append(CallLog.call_date >= _ensure_aware(filters.date_from))
    if filters.date_to is not None:
        conditions.append(CallLog.call_date <= _end_of_day(_ensure_aware(filters.date_to)))
    if filters.search:
        stmt = stmt.join(Business, Business.id == CallLog.business_id)
        conditions.append(Business.business_name.ilike(f"%{filters.search.strip()}%"))

    if conditions:
        stmt = stmt.where(and_(*conditions))
    return stmt


def _apply_sort(stmt: Select, filters: CallLogFilters) -> Select:
    column = _SORTABLE_COLUMNS.get(filters.sort_by, CallLog.call_date)
    if filters.sort_order == "asc":
        return stmt.order_by(column.asc())
    return stmt.order_by(column.desc())


def _serialize(log: CallLog) -> CallLogResponse:
    data = CallLogResponse.model_validate(log).model_dump()
    data["agent_name"] = log.agent.name if log.agent is not None else None
    return CallLogResponse(**data)


async def get_call_logs(
    db: AsyncSession,
    filters: CallLogFilters,
    user: User | None = None,
    page: int = 1,
    per_page: int = 20,
) -> CallLogListResponse:
    page = max(1, page)
    per_page = min(max(1, per_page), 100)

    base = select(CallLog).options(selectinload(CallLog.agent))
    filtered = _apply_filters(base, filters, user)

    count_stmt = _apply_filters(select(func.count(CallLog.id)), filters, user)
    total = (await db.scalar(count_stmt)) or 0

    stmt = _apply_sort(filtered, filters).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(stmt)
    logs = result.scalars().unique().all()

    items = [_serialize(log) for log in logs]
    pages = (total + per_page - 1) // per_page if total else 0
    return CallLogListResponse(
        items=items, total=total, page=page, per_page=per_page, pages=pages
    )


async def get_call_log(db: AsyncSession, call_log_id: uuid.UUID) -> CallLog:
    log = (
        await db.execute(
            select(CallLog)
            .where(CallLog.id == call_log_id)
            .options(selectinload(CallLog.agent), selectinload(CallLog.business))
        )
    ).scalar_one_or_none()
    if log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call log not found",
        )
    return log


async def create_call_log(
    db: AsyncSession, data: CallLogCreate, user: User
) -> CallLog:
    business = await db.get(Business, data.business_id)
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found",
        )
    if user.role != UserRole.ADMIN and business.assigned_agent_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to log calls for this business",
        )

    call_date = data.call_date or datetime.now(UTC)
    call_date = _ensure_aware(call_date)

    log = CallLog(
        business_id=data.business_id,
        agent_id=user.id,
        call_date=call_date,
        duration=data.duration,
        call_result=data.call_result,
        notes=data.notes,
    )
    business.status = data.call_result
    db.add(log)
    await db.commit()
    return await get_call_log(db, log.id)


async def get_business_call_logs(
    db: AsyncSession, business_id: uuid.UUID
) -> list[CallLog]:
    result = await db.execute(
        select(CallLog)
        .where(CallLog.business_id == business_id)
        .options(selectinload(CallLog.agent))
        .order_by(CallLog.call_date.desc())
    )
    return list(result.scalars().all())


async def get_agent_call_logs(
    db: AsyncSession, agent_id: uuid.UUID
) -> list[CallLog]:
    result = await db.execute(
        select(CallLog)
        .where(CallLog.agent_id == agent_id)
        .options(selectinload(CallLog.agent), selectinload(CallLog.business))
        .order_by(CallLog.call_date.desc())
    )
    return list(result.scalars().all())
