from __future__ import annotations

import uuid
from decimal import Decimal
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.business import Business
    from app.models.service import Service


class DealStatus(str, PyEnum):
    PROSPECT = "prospect"
    NEGOTIATION = "negotiation"
    PROPOSAL = "proposal"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class Deal(Base):
    __tablename__ = "deals"
    __table_args__ = (
        CheckConstraint(
            "closing_probability >= 0 AND closing_probability <= 100",
            name="ck_deals_closing_probability_range",
        ),
    )

    business_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
    )
    service_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("services.id", ondelete="SET NULL"),
        nullable=True,
    )
    estimated_value: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    closing_probability: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    status: Mapped[DealStatus] = mapped_column(
        Enum(
            DealStatus,
            name="deal_status",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        default=DealStatus.PROSPECT,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    business: Mapped[Business] = relationship(back_populates="deals")
    service: Mapped[Service | None] = relationship(back_populates="deals")

    def __repr__(self) -> str:
        return f"<Deal {self.id} status={self.status.value}>"
