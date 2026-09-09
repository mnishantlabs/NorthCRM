from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.business import Business, BusinessStatus
from app.models.user import User, UserRole
from app.schemas.business import (
    BusinessCreate,
    BusinessListResponse,
    BusinessResponse,
    BusinessUpdate,
)
from app.services import import_export


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


class BusinessFilters:
    def __init__(
        self,
        search: str | None = None,
        business_status: BusinessStatus | None = None,
        assigned_agent_id: uuid.UUID | None = None,
        category: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ):
        self.search = search
        self.business_status = business_status
        self.assigned_agent_id = assigned_agent_id
        self.category = category
        self.date_from = date_from
        self.date_to = date_to
        self.sort_by = sort_by
        self.sort_order = sort_order


_SORTABLE_COLUMNS = {
    "created_at": Business.created_at,
    "updated_at": Business.updated_at,
    "business_name": Business.business_name,
    "owner_name": Business.owner_name,
    "phone": Business.phone,
    "email": Business.email,
    "category": Business.category,
    "status": Business.status,
}


def _apply_business_filters(
    stmt: Select, filters: BusinessFilters, user: User | None = None
) -> Select:
    conditions: list = []

    if user is not None and user.role != UserRole.ADMIN:
        conditions.append(Business.assigned_agent_id == user.id)

    if filters.search:
        pattern = f"%{filters.search.strip()}%"
        conditions.append(
            or_(
                Business.business_name.ilike(pattern),
                Business.owner_name.ilike(pattern),
                Business.phone.ilike(pattern),
                Business.email.ilike(pattern),
                Business.category.ilike(pattern),
            )
        )
    if filters.business_status is not None:
        conditions.append(Business.status == filters.business_status)
    if filters.assigned_agent_id is not None:
        conditions.append(Business.assigned_agent_id == filters.assigned_agent_id)
    if filters.category:
        conditions.append(Business.category.ilike(f"%{filters.category.strip()}%"))
    if filters.date_from is not None:
        conditions.append(Business.created_at >= _ensure_aware(filters.date_from))
    if filters.date_to is not None:
        conditions.append(
            Business.created_at <= _end_of_day(_ensure_aware(filters.date_to))
        )

    if conditions:
        stmt = stmt.where(and_(*conditions))
    return stmt


def _apply_business_sort(stmt: Select, filters: BusinessFilters) -> Select:
    column = _SORTABLE_COLUMNS.get(filters.sort_by, Business.created_at)
    if filters.sort_order == "asc":
        return stmt.order_by(column.asc())
    return stmt.order_by(column.desc())


async def get_businesses(
    db: AsyncSession,
    filters: BusinessFilters,
    user: User,
    page: int = 1,
    per_page: int = 20,
) -> BusinessListResponse:
    page = max(1, page)
    per_page = min(max(1, per_page), 100)

    base = select(Business).options(selectinload(Business.assigned_agent))
    filtered = _apply_business_filters(base, filters, user)

    count_stmt = _apply_business_filters(select(func.count(Business.id)), filters, user)
    total = (await db.scalar(count_stmt)) or 0

    stmt = _apply_business_sort(filtered, filters).offset((page - 1) * per_page).limit(
        per_page
    )
    result = await db.execute(stmt)
    businesses = result.scalars().unique().all()

    items = [BusinessResponse.model_validate(business) for business in businesses]
    pages = (total + per_page - 1) // per_page if total else 0
    return BusinessListResponse(
        items=items, total=total, page=page, per_page=per_page, pages=pages
    )


async def get_business(
    db: AsyncSession, business_id: uuid.UUID, user: User | None = None
) -> Business:
    business = (
        await db.execute(
            select(Business)
            .where(Business.id == business_id)
            .options(
                selectinload(Business.assigned_agent),
                selectinload(Business.call_logs),
                selectinload(Business.follow_ups),
                selectinload(Business.deals),
                selectinload(Business.services),
            )
        )
    ).scalar_one_or_none()
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found",
        )
    if (
        user is not None
        and user.role != UserRole.ADMIN
        and business.assigned_agent_id != user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this business",
        )
    return business


async def _ensure_agent_exists(db: AsyncSession, agent_id: uuid.UUID) -> User:
    agent = await db.get(User, agent_id)
    if agent is None or not agent.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )
    return agent


async def _business_email_exists(
    db: AsyncSession, email: str, exclude_id: uuid.UUID | None = None
) -> bool:
    stmt = select(Business.id).where(Business.email == email)
    if exclude_id is not None:
        stmt = stmt.where(Business.id != exclude_id)
    return (await db.scalar(stmt)) is not None


async def create_business(
    db: AsyncSession, data: BusinessCreate, user: User
) -> Business:
    payload = data.model_dump()

    if payload.get("email"):
        if await _business_email_exists(db, payload["email"]):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Business with this email already exists",
            )
    if payload.get("assigned_agent_id") is not None:
        await _ensure_agent_exists(db, payload["assigned_agent_id"])

    if user.role != UserRole.ADMIN:
        payload["assigned_agent_id"] = user.id

    business = Business(**payload)
    db.add(business)
    await db.commit()
    return await get_business(db, business.id, user)


async def update_business(
    db: AsyncSession, business_id: uuid.UUID, data: BusinessUpdate, user: User
) -> Business:
    business = await get_business(db, business_id, user)
    payload = data.model_dump(exclude_unset=True, exclude_none=True)

    new_email = payload.get("email")
    if new_email and await _business_email_exists(db, new_email, business_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Business with this email already exists",
        )

    new_agent_id = payload.get("assigned_agent_id")
    if new_agent_id is not None:
        if user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can reassign agents",
            )
        await _ensure_agent_exists(db, new_agent_id)

    for field, value in payload.items():
        setattr(business, field, value)
    await db.commit()
    return await get_business(db, business_id, user)


async def delete_business(
    db: AsyncSession, business_id: uuid.UUID, user: User
) -> None:
    business = await get_business(db, business_id, user)
    await db.delete(business)
    await db.commit()


async def update_status(
    db: AsyncSession,
    business_id: uuid.UUID,
    business_status: BusinessStatus,
    user: User,
) -> Business:
    business = await get_business(db, business_id, user)
    business.status = business_status
    await db.commit()
    return await get_business(db, business_id, user)


async def assign_agent(
    db: AsyncSession, business_id: uuid.UUID, agent_id: uuid.UUID, user: User
) -> Business:
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can assign agents",
        )
    business = await get_business(db, business_id, user)
    await _ensure_agent_exists(db, agent_id)
    business.assigned_agent_id = agent_id
    await db.commit()
    await db.refresh(business, ["assigned_agent", "assigned_agent_id"])
    return business


def _build_business_from_row(row: dict) -> dict:
    payload: dict = {}
    for field in (
        "business_name",
        "owner_name",
        "phone",
        "email",
        "website",
        "address",
        "city",
        "state",
        "country",
        "google_maps_url",
        "category",
        "status",
        "notes",
    ):
        value = row.get(field)
        if value is not None and value != "":
            payload[field] = value
    return payload


async def _is_duplicate(db: AsyncSession, row: dict) -> bool:
    email = row.get("email")
    if email:
        exists = await db.scalar(
            select(Business.id).where(func.lower(Business.email) == str(email).lower())
        )
        if exists is not None:
            return True

    name = str(row.get("business_name") or "").strip()
    phone = row.get("phone")
    stmt = select(Business.id).where(
        func.lower(Business.business_name) == name.lower()
    )
    if phone:
        stmt = stmt.where(Business.phone == str(phone))
    return (await db.scalar(stmt)) is not None


async def import_businesses(db: AsyncSession, file, user: User) -> dict[str, int]:
    filename = (getattr(file, "filename", None) or "").lower()
    content = await file.read()

    if filename.endswith((".xlsx", ".xls")):
        rows = import_export.parse_excel(content)
    else:
        rows = import_export.parse_csv(content)

    valid_rows, row_errors = import_export.validate_rows(rows)

    created = 0
    duplicates = 0
    for row in valid_rows:
        if await _is_duplicate(db, row):
            duplicates += 1
            continue
        payload = _build_business_from_row(row)
        if user.role != UserRole.ADMIN:
            payload["assigned_agent_id"] = user.id
        business = Business(**payload)
        db.add(business)
        created += 1

    await db.commit()
    return {
        "total": len(rows),
        "created": created,
        "duplicates": duplicates,
        "errors": len(row_errors),
    }


_EXPORT_COLUMNS = [
    "business_name",
    "owner_name",
    "phone",
    "email",
    "website",
    "address",
    "city",
    "state",
    "country",
    "google_maps_url",
    "category",
    "status",
    "notes",
    "assigned_agent_id",
    "created_at",
    "updated_at",
]


async def export_businesses(
    db: AsyncSession,
    filters: BusinessFilters,
    export_format: str,
    user: User,
) -> bytes:
    base = select(Business).options(selectinload(Business.assigned_agent))
    filtered = _apply_business_filters(base, filters, user)
    stmt = _apply_business_sort(filtered, filters)
    result = await db.execute(stmt)
    businesses = result.scalars().unique().all()

    rows = [
        {column: getattr(business, column) for column in _EXPORT_COLUMNS}
        for business in businesses
    ]

    if (export_format or "csv").lower() in ("excel", "xlsx"):
        return import_export.export_excel(rows)
    return import_export.export_csv(rows)
