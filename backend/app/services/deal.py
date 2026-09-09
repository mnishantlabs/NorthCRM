from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import Select, and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.business import Business
from app.models.deal import Deal, DealStatus
from app.models.service import Service
from app.models.user import User, UserRole
from app.schemas.deal import (
    DealCreate,
    DealListResponse,
    DealResponse,
    DealUpdate,
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


class DealFilters:
    def __init__(
        self,
        business_id: uuid.UUID | None = None,
        service_id: uuid.UUID | None = None,
        deal_status: DealStatus | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        search: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ):
        self.business_id = business_id
        self.service_id = service_id
        self.deal_status = deal_status
        self.date_from = date_from
        self.date_to = date_to
        self.search = search
        self.sort_by = sort_by
        self.sort_order = sort_order


_SORTABLE_COLUMNS = {
    "created_at": Deal.created_at,
    "updated_at": Deal.updated_at,
    "estimated_value": Deal.estimated_value,
    "closing_probability": Deal.closing_probability,
    "status": Deal.status,
}


def _apply_filters(
    stmt: Select, filters: DealFilters, user: User | None = None
) -> Select:
    conditions: list = []

    needs_business = (
        (user is not None and user.role != UserRole.ADMIN) or bool(filters.search)
    )
    if needs_business:
        stmt = stmt.join(Business, Business.id == Deal.business_id)

    if user is not None and user.role != UserRole.ADMIN:
        conditions.append(Business.assigned_agent_id == user.id)
    if filters.business_id is not None:
        conditions.append(Deal.business_id == filters.business_id)
    if filters.service_id is not None:
        conditions.append(Deal.service_id == filters.service_id)
    if filters.deal_status is not None:
        conditions.append(Deal.status == filters.deal_status)
    if filters.date_from is not None:
        conditions.append(Deal.created_at >= _ensure_aware(filters.date_from))
    if filters.date_to is not None:
        conditions.append(Deal.created_at <= _end_of_day(_ensure_aware(filters.date_to)))
    if filters.search:
        conditions.append(Business.business_name.ilike(f"%{filters.search.strip()}%"))

    if conditions:
        stmt = stmt.where(and_(*conditions))
    return stmt


def _apply_sort(stmt: Select, filters: DealFilters) -> Select:
    column = _SORTABLE_COLUMNS.get(filters.sort_by, Deal.created_at)
    if filters.sort_order == "asc":
        return stmt.order_by(column.asc())
    return stmt.order_by(column.desc())


def _serialize(deal: Deal) -> DealResponse:
    data = DealResponse.model_validate(deal).model_dump()
    data["business_name"] = (
        deal.business.business_name if deal.business is not None else None
    )
    data["service_name"] = deal.service.name if deal.service is not None else None
    return DealResponse(**data)


async def get_deals(
    db: AsyncSession,
    filters: DealFilters,
    user: User | None = None,
    page: int = 1,
    per_page: int = 20,
) -> DealListResponse:
    page = max(1, page)
    per_page = min(max(1, per_page), 100)

    base = select(Deal).options(
        selectinload(Deal.business), selectinload(Deal.service)
    )
    filtered = _apply_filters(base, filters, user)

    count_stmt = _apply_filters(select(func.count(Deal.id)), filters, user)
    total = (await db.scalar(count_stmt)) or 0

    stmt = _apply_sort(filtered, filters).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(stmt)
    deals = result.scalars().unique().all()

    items = [_serialize(deal) for deal in deals]
    pages = (total + per_page - 1) // per_page if total else 0
    return DealListResponse(
        items=items, total=total, page=page, per_page=per_page, pages=pages
    )


async def get_deal(
    db: AsyncSession, deal_id: uuid.UUID, user: User | None = None
) -> Deal:
    deal = (
        await db.execute(
            select(Deal)
            .where(Deal.id == deal_id)
            .options(selectinload(Deal.business), selectinload(Deal.service))
        )
    ).scalar_one_or_none()
    if deal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found",
        )
    if (
        user is not None
        and user.role != UserRole.ADMIN
        and deal.business.assigned_agent_id != user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this deal",
        )
    return deal


async def create_deal(
    db: AsyncSession, data: DealCreate, user: User
) -> Deal:
    business = await db.get(Business, data.business_id)
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found",
        )
    if user.role != UserRole.ADMIN and business.assigned_agent_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create deals for this business",
        )
    if data.service_id is not None:
        service = await db.get(Service, data.service_id)
        if service is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found",
            )

    deal = Deal(
        business_id=data.business_id,
        service_id=data.service_id,
        estimated_value=data.estimated_value,
        closing_probability=data.closing_probability,
        status=data.status,
        notes=data.notes,
    )
    db.add(deal)
    await db.commit()
    return await get_deal(db, deal.id, user)


async def update_deal(
    db: AsyncSession, deal_id: uuid.UUID, data: DealUpdate, user: User
) -> Deal:
    deal = await get_deal(db, deal_id, user)
    payload = data.model_dump(exclude_unset=True)

    business_id = payload.get("business_id")
    if business_id is not None:
        business = await db.get(Business, business_id)
        if business is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found",
            )
        if user.role != UserRole.ADMIN and business.assigned_agent_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to move this deal to the given business",
            )

    service_id = payload.get("service_id")
    if service_id is not None:
        service = await db.get(Service, service_id)
        if service is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found",
            )

    for field, value in payload.items():
        setattr(deal, field, value)
    await db.commit()
    return await get_deal(db, deal_id, user)


async def update_status(
    db: AsyncSession, deal_id: uuid.UUID, deal_status: DealStatus, user: User
) -> Deal:
    deal = await get_deal(db, deal_id, user)
    deal.status = deal_status
    await db.commit()
    return await get_deal(db, deal_id, user)


async def delete_deal(
    db: AsyncSession, deal_id: uuid.UUID, user: User
) -> None:
    deal = await get_deal(db, deal_id, user)
    await db.delete(deal)
    await db.commit()
