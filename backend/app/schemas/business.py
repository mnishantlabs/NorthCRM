from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.business import BusinessStatus
from app.schemas.common import PaginatedResponse
from app.schemas.user import UserResponse


class BusinessResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_name: str
    owner_name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    google_maps_url: str | None = None
    category: str | None = None
    assigned_agent_id: uuid.UUID | None = None
    status: BusinessStatus
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    assigned_agent: UserResponse | None = None


class BusinessCreate(BaseModel):
    business_name: str = Field(..., min_length=1, max_length=255)
    owner_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    website: str | None = Field(default=None, max_length=500)
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default="India", max_length=100)
    google_maps_url: str | None = Field(default=None, max_length=500)
    category: str | None = Field(default=None, max_length=255)
    assigned_agent_id: uuid.UUID | None = None
    status: BusinessStatus = BusinessStatus.NEW
    notes: str | None = None


class BusinessUpdate(BaseModel):
    business_name: str | None = Field(default=None, min_length=1, max_length=255)
    owner_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    website: str | None = Field(default=None, max_length=500)
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    google_maps_url: str | None = Field(default=None, max_length=500)
    category: str | None = Field(default=None, max_length=255)
    assigned_agent_id: uuid.UUID | None = None
    status: BusinessStatus | None = None
    notes: str | None = None


class BusinessListResponse(PaginatedResponse[BusinessResponse]):
    pass


class BusinessStatusUpdate(BaseModel):
    status: BusinessStatus


class BusinessAssign(BaseModel):
    agent_id: uuid.UUID
