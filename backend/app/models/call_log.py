from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.business import BUSINESS_STATUS_ENUM, BusinessStatus

if TYPE_CHECKING:
    from app.models.business import Business
    from app.models.user import User


class CallLog(Base):
    __tablename__ = "call_logs"

    business_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    call_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)
    call_result: Mapped[BusinessStatus] = mapped_column(
        BUSINESS_STATUS_ENUM, nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    business: Mapped[Business] = relationship(back_populates="call_logs")
    agent: Mapped[User] = relationship(back_populates="call_logs")

    def __repr__(self) -> str:
        return f"<CallLog {self.id} business={self.business_id}>"
