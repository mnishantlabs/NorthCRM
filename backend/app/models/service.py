from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.business import Business
    from app.models.deal import Deal


class Service(Base):
    __tablename__ = "services"

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    businesses: Mapped[list[Business]] = relationship(
        secondary="business_services",
        back_populates="services",
    )
    deals: Mapped[list[Deal]] = relationship(back_populates="service")

    def __repr__(self) -> str:
        return f"<Service {self.name!r}>"
