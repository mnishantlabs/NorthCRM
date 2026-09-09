from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.follow_up import FollowUpStatus
from app.schemas.common import PaginatedResponse


class FollowUpResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    agent_id: uuid.UUID
    followup_date: datetime
    status: FollowUpStatus
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    agent_name: str | None = None
    business_name: str | None = None


class FollowUpCreate(BaseModel):
    business_id: uuid.UUID
    followup_date: datetime
    notes: str | None = None


class FollowUpUpdate(BaseModel):
    followup_date: datetime | None = None
    status: FollowUpStatus | None = None
    notes: str | None = None


class FollowUpStatusUpdate(BaseModel):
    status: FollowUpStatus


class FollowUpListResponse(PaginatedResponse[FollowUpResponse]):
    pass
