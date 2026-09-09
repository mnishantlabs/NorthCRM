from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, require_admin
from app.models.service import Service
from app.models.user import User
from app.schemas.service import (
    ServiceCreate,
    ServiceListResponse,
    ServiceResponse,
    ServiceUpdate,
)

router = APIRouter(prefix="/services", tags=["services"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(require_admin())]


async def _get_service_or_404(db: AsyncSession, service_id: uuid.UUID) -> Service:
    service = await db.get(Service, service_id)
    if service is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )
    return service


@router.get(
    "",
    response_model=ServiceListResponse,
    summary="List services",
)
async def list_services(
    db: DbDep,
    current_user: CurrentUser,
    search: str | None = Query(default=None, min_length=1),
    is_active: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
) -> ServiceListResponse:
    conditions = []
    if is_active is not None:
        conditions.append(Service.is_active == is_active)
    if search:
        conditions.append(Service.name.ilike(f"%{search.strip()}%"))

    base = select(Service)
    count_stmt = select(func.count(Service.id))
    if conditions:
        base = base.where(*conditions)
        count_stmt = count_stmt.where(*conditions)

    total = (await db.scalar(count_stmt)) or 0
    result = await db.execute(
        base.order_by(Service.name.asc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    services = result.scalars().all()
    pages = (total + per_page - 1) // per_page if total else 0

    return ServiceListResponse(
        items=[ServiceResponse.model_validate(service) for service in services],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )


@router.post(
    "",
    response_model=ServiceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a service (admin only)",
)
async def create_service(db: DbDep, admin: AdminUser, payload: ServiceCreate) -> Service:
    existing = await db.scalar(select(Service).where(Service.name == payload.name))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A service with this name already exists",
        )
    service = Service(name=payload.name, description=payload.description)
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service


@router.put(
    "/{service_id}",
    response_model=ServiceResponse,
    summary="Update a service (admin only)",
)
async def update_service(
    db: DbDep, admin: AdminUser, service_id: uuid.UUID, payload: ServiceUpdate
) -> Service:
    service = await _get_service_or_404(db, service_id)
    data = payload.model_dump(exclude_unset=True, exclude_none=True)

    new_name = data.get("name")
    if new_name and new_name != service.name:
        existing = await db.scalar(
            select(Service).where(Service.name == new_name, Service.id != service_id)
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A service with this name already exists",
            )

    for field, value in data.items():
        setattr(service, field, value)
    await db.commit()
    await db.refresh(service)
    return service


@router.delete(
    "/{service_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a service (admin only)",
)
async def delete_service(db: DbDep, admin: AdminUser, service_id: uuid.UUID):
    service = await _get_service_or_404(db, service_id)
    await db.delete(service)
    await db.commit()
    return None
