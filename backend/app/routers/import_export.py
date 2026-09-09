from __future__ import annotations

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

from app.core.deps import get_db, require_admin
from app.models.user import User
from app.services import business as business_service

router = APIRouter(prefix="/import-export", tags=["import-export"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
AdminUser = Annotated[User, Depends(require_admin())]

_ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


class ImportResult(BaseModel):
    total: int
    created: int
    duplicates: int
    errors: int


@router.post(
    "/import",
    response_model=ImportResult,
    status_code=status.HTTP_201_CREATED,
    summary="Import businesses from a CSV or Excel file (admin only)",
)
async def import_data(
    db: DbDep,
    admin: AdminUser,
    file: Annotated[UploadFile, File(...)],
) -> ImportResult:
    filename = (file.filename or "").lower()
    if not filename.endswith(tuple(_ALLOWED_EXTENSIONS)):
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
async def export_data(
    db: DbDep,
    admin: AdminUser,
    export_format: str = Query(
        default="csv", pattern="^(csv|excel|xlsx)$", alias="format"
    ),
) -> Response:
    filters = business_service.BusinessFilters()
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
