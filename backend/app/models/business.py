from __future__ import annotations

from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import (
    Enum,
    ForeignKey,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.call_log import CallLog
    from app.models.deal import Deal
    from app.models.follow_up import FollowUp
    from app.models.service import Service
    from app.models.user import User


class BusinessStatus(str, PyEnum):
    NEW = "new"
    CALLED = "called"
    BUSY = "busy"
    INTERESTED = "interested"
    NOT_INTERESTED = "not_interested"
    NO_ANSWER = "no_answer"
    CALLBACK = "callback"
    MEETING_SCHEDULED = "meeting_scheduled"
    PROPOSAL_SENT = "proposal_sent"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"
    SPAM = "spam"


BUSINESS_STATUS_ENUM = Enum(
    BusinessStatus,
    name="business_status",
    values_callable=lambda enum_cls: [member.value for member in enum_cls],
)


class Business(Base):
    __tablename__ = "businesses"

    business_name: Mapped[str] = mapped_column(
        String(255), nullable=False, index=True
    )
    owner_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(
        String(50), nullable=True, index=True
    )
    email: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(
        String(100), default="India", nullable=True
    )
    google_maps_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    category: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )
    assigned_agent_id: Mapped[Uuid | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[BusinessStatus] = mapped_column(
        BUSINESS_STATUS_ENUM, default=BusinessStatus.NEW, nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    assigned_agent: Mapped[User | None] = relationship(back_populates="businesses")
    services: Mapped[list[Service]] = relationship(
        secondary="business_services",
        back_populates="businesses",
    )
    call_logs: Mapped[list[CallLog]] = relationship(
        back_populates="business", cascade="all, delete-orphan"
    )
    follow_ups: Mapped[list[FollowUp]] = relationship(
        back_populates="business", cascade="all, delete-orphan"
    )
    deals: Mapped[list[Deal]] = relationship(
        back_populates="business", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Business {self.business_name!r}>"
