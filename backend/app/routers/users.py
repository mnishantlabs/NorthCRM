from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_admin
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.schemas.common import PaginatedResponse
from app.schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
AdminUser = Annotated[User, Depends(require_admin())]


class RoleUpdate(BaseModel):
    role: UserRole


async def _get_user_or_404(db: AsyncSession, user_id: uuid.UUID) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


def _ensure_agent_role(target_role: UserRole | None) -> None:
    if target_role is not None and target_role != UserRole.AGENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only agent role can be created through this endpoint",
        )


@router.get(
    "",
    response_model=PaginatedResponse[UserResponse],
    summary="List users (admin only)",
)
async def list_users(
    db: DbDep,
    admin: AdminUser,
    role: Annotated[UserRole | None, Query(description="Filter by role")] = None,
    search: Annotated[str | None, Query(min_length=1)] = None,
    is_active: Annotated[bool | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 20,
) -> PaginatedResponse[UserResponse]:
    conditions = []
    if role is not None:
        conditions.append(User.role == role)
    if is_active is not None:
        conditions.append(User.is_active == is_active)
    if search:
        pattern = f"%{search.strip()}%"
        conditions.append(
            (User.name.ilike(pattern)) | (User.email.ilike(pattern))
        )

    base = select(User)
    count_stmt = select(func.count(User.id))
    if conditions:
        base = base.where(*conditions)
        count_stmt = count_stmt.where(*conditions)

    total = (await db.scalar(count_stmt)) or 0
    result = await db.execute(
        base.order_by(User.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    users = result.scalars().all()
    pages = (total + per_page - 1) // per_page if total else 0

    return PaginatedResponse[UserResponse](
        items=[UserResponse.model_validate(user) for user in users],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get a single user (admin only)",
)
async def get_user(db: DbDep, admin: AdminUser, user_id: uuid.UUID) -> User:
    return await _get_user_or_404(db, user_id)


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an agent user (admin only)",
)
async def create_user(db: DbDep, admin: AdminUser, payload: UserCreate) -> User:
    _ensure_agent_role(payload.role)

    email = str(payload.email).lower()
    existing = await db.scalar(select(User).where(User.email == email))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    user = User(
        name=payload.name,
        email=email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        phone=payload.phone,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update a user (admin only)",
)
async def update_user(
    db: DbDep, admin: AdminUser, user_id: uuid.UUID, payload: UserUpdate
) -> User:
    user = await _get_user_or_404(db, user_id)
    data = payload.model_dump(exclude_unset=True, exclude_none=True)

    new_email = data.get("email")
    if new_email and new_email != user.email:
        new_email = str(new_email).lower()
        existing = await db.scalar(select(User).where(User.email == new_email))
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered",
            )
        data["email"] = new_email

    if "role" in data:
        _ensure_agent_role(data["role"])

    for field, value in data.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate a user (admin only)",
)
async def deactivate_user(db: DbDep, admin: AdminUser, user_id: uuid.UUID):
    user = await _get_user_or_404(db, user_id)
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )
    user.is_active = False
    await db.commit()
    return None


@router.patch(
    "/{user_id}/role",
    response_model=UserResponse,
    summary="Change a user's role (admin only)",
)
async def change_user_role(
    db: DbDep, admin: AdminUser, user_id: uuid.UUID, payload: RoleUpdate
) -> User:
    user = await _get_user_or_404(db, user_id)
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role",
        )
    user.role = payload.role
    await db.commit()
    await db.refresh(user)
    return user
