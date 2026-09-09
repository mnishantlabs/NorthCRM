from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Table, Uuid

from app.core.database import Base

"""Association table linking businesses to their services (many-to-many)."""

business_services = Table(
    "business_services",
    Base.metadata,
    Column(
        "business_id",
        Uuid(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "service_id",
        Uuid(as_uuid=True),
        ForeignKey("services.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
