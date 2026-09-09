from __future__ import annotations

import uuid
from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.business import BusinessStatus
from app.schemas.common import PaginatedResponse


class CallLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    agent_id: uuid.UUID
    call_date: datetime
    duration: int | None = None
    call_result: BusinessStatus
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    agent_name: str | None = None


class CallLogCreate(BaseModel):
    business_id: uuid.UUID
    call_date: datetime | None = Field(default_factory=lambda: datetime.now(UTC))
    duration: int | None = Field(default=None, ge=0)
    call_result: BusinessStatus
    notes: str | None = None


class CallLogListResponse(PaginatedResponse[CallLogResponse]):
    pass
