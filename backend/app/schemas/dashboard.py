from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class DashboardStats(BaseModel):
    today_calls: int = 0
    pending_calls: int = 0
    completed_calls: int = 0
    interested_clients: int = 0
    callbacks_today: int = 0
    deals_closed: int = 0
    revenue: Decimal = Decimal("0.00")
    monthly_sales: Decimal = Decimal("0.00")


class CallsPerDay(BaseModel):
    date: date
    count: int = 0


class AgentPerformance(BaseModel):
    agent_id: uuid.UUID
    agent_name: str
    calls_count: int = 0
    deals_closed: int = 0
    revenue: Decimal = Decimal("0.00")


class SalesData(BaseModel):
    month: str
    revenue: Decimal = Decimal("0.00")


class LeadStatus(BaseModel):
    status: str
    count: int = 0
