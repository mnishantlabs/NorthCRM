from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, require_admin
from app.models.business import BusinessStatus
from app.models.user import User
from app.schemas.business import (
    BusinessAssign,
    BusinessCreate,
    BusinessListResponse,
    BusinessResponse,
    BusinessStatusUpdate,
    BusinessUpdate,
)
from app.services import business as business_service

router = APIRouter(prefix="/businesses", tags=["businesses"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(require_admin())]


class ImportResult(BaseModel):
    total: int
    created: int
    duplicates: int
    errors: int


def _filters_from_query(
    search: str | None,
    business_status: BusinessStatus | None,
    assigned_agent: uuid.UUID | None,
    category: str | None,
    date_from: datetime | None,
    date_to: datetime | None,
    sort_by: str,
    sort_order: str,
) -> business_service.BusinessFilters:
    return business_service.BusinessFilters(
        search=search,
        business_status=business_status,
        assigned_agent_id=assigned_agent,
        category=category,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get(
    "",
    response_model=BusinessListResponse,
    summary="List businesses (admin sees all, agent sees assigned)",
)
async def list_businesses(
    db: DbDep,
    current_user: CurrentUser,
    search: Annotated[str | None, Query()] = None,
    status_filter: Annotated[
        BusinessStatus | None, Query(alias="status", description="Filter by business status")
    ] = None,
    assigned_agent: Annotated[uuid.UUID | None, Query()] = None,
    category: Annotated[str | None, Query()] = None,
    date_from: Annotated[datetime | None, Query()] = None,
    date_to: Annotated[datetime | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 20,
    sort_by: Annotated[str, Query()] = "created_at",
    sort_order: Annotated[str, Query(pattern="^(asc|desc)$")] = "desc",
) -> BusinessListResponse:
    filters = _filters_from_query(
        search=search,
        business_status=status_filter,
        assigned_agent=assigned_agent,
        category=category,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return await business_service.get_businesses(db, filters, current_user, page, per_page)


@router.post(
    "/import",
    response_model=ImportResult,
    status_code=status.HTTP_201_CREATED,
    summary="Import businesses from a CSV or Excel file (admin only)",
)
async def import_businesses(
    db: DbDep,
    admin: AdminUser,
    file: Annotated[UploadFile, File(...)],
) -> ImportResult:
    allowed = {".csv", ".xlsx", ".xls"}
    filename = (file.filename or "").lower()
    if not filename.endswith(tuple(allowed)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Upload a .csv, .xlsx or .xls file.",
        )
    try:
        result = await business_service.import_businesses(db, file, admin)
    finally:
        await file.close()
    return ImportResult(**result)


@router.get(
    "/export",
    summary="Export businesses as CSV or Excel (admin only)",
)
async def export_businesses(
    db: DbDep,
    admin: AdminUser,
    export_format: Annotated[
        str, Query(pattern="^(csv|excel|xlsx)$", alias="format")
    ] = "csv",
    search: Annotated[str | None, Query()] = None,
    status_filter: Annotated[
        BusinessStatus | None, Query(alias="status", description="Filter by business status")
    ] = None,
    assigned_agent: Annotated[uuid.UUID | None, Query()] = None,
    category: Annotated[str | None, Query()] = None,
    date_from: Annotated[datetime | None, Query()] = None,
    date_to: Annotated[datetime | None, Query()] = None,
    sort_by: Annotated[str, Query()] = "created_at",
    sort_order: Annotated[str, Query(pattern="^(asc|desc)$")] = "desc",
) -> Response:
    filters = _filters_from_query(
        search=search,
        business_status=status_filter,
        assigned_agent=assigned_agent,
        category=category,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    content = await business_service.export_businesses(
        db, filters, export_format, admin
    )

    normalized = export_format.lower()
    if normalized in ("excel", "xlsx"):
        media_type = (
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        disposition = "attachment; filename=businesses.xlsx"
    else:
        media_type = "text/csv"
        disposition = "attachment; filename=businesses.csv"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": disposition},
    )


@router.get(
    "/{business_id}",
    response_model=BusinessResponse,
    summary="Get a single business",
)
async def get_business(
    db: DbDep, current_user: CurrentUser, business_id: uuid.UUID
) -> BusinessResponse:
    business = await business_service.get_business(db, business_id, current_user)
    return BusinessResponse.model_validate(business)


@router.post(
    "",
    response_model=BusinessResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a business (admin only)",
)
async def create_business(
    db: DbDep, admin: AdminUser, payload: BusinessCreate
) -> BusinessResponse:
    business = await business_service.create_business(db, payload, admin)
    return BusinessResponse.model_validate(business)


@router.put(
    "/{business_id}",
    response_model=BusinessResponse,
    summary="Update a business (admin only)",
)
async def update_business(
    db: DbDep,
    admin: AdminUser,
    business_id: uuid.UUID,
    payload: BusinessUpdate,
) -> BusinessResponse:
    business = await business_service.update_business(db, business_id, payload, admin)
    return BusinessResponse.model_validate(business)


@router.delete(
    "/{business_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a business (admin only)",
)
async def delete_business(db: DbDep, admin: AdminUser, business_id: uuid.UUID):
    await business_service.delete_business(db, business_id, admin)
    return None


@router.patch(
    "/{business_id}/status",
    response_model=BusinessResponse,
    summary="Update a business status",
)
async def update_business_status(
    db: DbDep,
    current_user: CurrentUser,
    business_id: uuid.UUID,
    payload: BusinessStatusUpdate,
) -> BusinessResponse:
    business = await business_service.update_status(
        db, business_id, payload.status, current_user
    )
    return BusinessResponse.model_validate(business)


@router.patch(
    "/{business_id}/assign",
    response_model=BusinessResponse,
    summary="Assign an agent to a business (admin only)",
)
async def assign_agent(
    db: DbDep,
    admin: AdminUser,
    business_id: uuid.UUID,
    payload: BusinessAssign,
) -> BusinessResponse:
    business = await business_service.assign_agent(
        db, business_id, payload.agent_id, admin
    )
    return BusinessResponse.model_validate(business)
