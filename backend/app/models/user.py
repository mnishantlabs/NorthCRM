from __future__ import annotations

from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.business import Business
    from app.models.call_log import CallLog
    from app.models.follow_up import FollowUp


class UserRole(str, PyEnum):
    ADMIN = "admin"
    AGENT = "agent"


class User(Base):
    __tablename__ = "users"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(
            UserRole,
            name="user_role",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        default=UserRole.AGENT,
        nullable=False,
    )
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    businesses: Mapped[list[Business]] = relationship(
        back_populates="assigned_agent"
    )
    call_logs: Mapped[list[CallLog]] = relationship(back_populates="agent")
    follow_ups: Mapped[list[FollowUp]] = relationship(back_populates="agent")

    def __repr__(self) -> str:
        return f"<User {self.email!r}>"
