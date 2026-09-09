from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.deal import DealStatus
from app.schemas.common import PaginatedResponse


class DealResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    service_id: uuid.UUID | None = None
    estimated_value: Decimal | None = None
    closing_probability: int | None = Field(default=None, ge=0, le=100)
    status: DealStatus
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    business_name: str | None = None
    service_name: str | None = None


class DealCreate(BaseModel):
    business_id: uuid.UUID
    service_id: uuid.UUID | None = None
    estimated_value: Decimal | None = Field(default=None, ge=0)
    closing_probability: int | None = Field(default=None, ge=0, le=100)
    status: DealStatus = DealStatus.PROSPECT
    notes: str | None = None


class DealUpdate(BaseModel):
    business_id: uuid.UUID | None = None
    service_id: uuid.UUID | None = None
    estimated_value: Decimal | None = Field(default=None, ge=0)
    closing_probability: int | None = Field(default=None, ge=0, le=100)
    status: DealStatus | None = None
    notes: str | None = None


class DealStatusUpdate(BaseModel):
    status: DealStatus


class DealListResponse(PaginatedResponse[DealResponse]):
    pass
