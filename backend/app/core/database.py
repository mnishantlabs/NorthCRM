from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import DateTime, Uuid
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.config import get_settings

settings = get_settings()


def _build_async_database_url(database_url: str) -> str:
    """Convert a sync Postgres URL into an asyncpg-compatible URL."""
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    return database_url


_engine_url = _build_async_database_url(settings.DATABASE_URL)
_engine_kwargs: dict[str, Any] = {"echo": False}
if _engine_url.startswith("sqlite"):
    # SQLite does not support connection pools; run with the default NullPool.
    _engine_kwargs["pool_pre_ping"] = False
else:
    _engine_kwargs.update(
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

engine = create_async_engine(_engine_url, **_engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Declarative base carrying common id / created_at / updated_at columns.

    Every model inherits a UUID primary key ``id`` plus ``created_at`` and
    ``updated_at`` timestamps.
    """

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding a fresh database session per request."""
    async with AsyncSessionLocal() as session:
        yield session


def column_names(model: type[Any]) -> list[str]:
    """Helper returning the mapped column names of a model (handy for CSV/Excel export)."""
    return [column.name for column in model.__table__.columns]
