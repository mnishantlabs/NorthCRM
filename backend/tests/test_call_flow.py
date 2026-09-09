"""Tests for call logs, follow-ups and deals."""
from __future__ import annotations

import pytest


async def _setup_admin(client):
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Admin", "email": "admin@test.com", "password": "Test@1234"},
    )
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "Test@1234"},
    )
    return {
        "client": client,
        "headers": {"Authorization": f"Bearer {login.json()['access_token']}"},
    }


async def _create_business(client, headers):
    return await client.post(
        "/api/v1/businesses",
        headers=headers,
        json={
            "business_name": "Acme Corp",
            "phone": "+1-555-0100",
            "category": "Restaurant",
        },
    )


@pytest.mark.asyncio
async def test_call_log_creation_updates_status(client):
    admin = await _setup_admin(client)
    biz = await _create_business(admin["client"], admin["headers"])
    biz_id = biz.json()["id"]

    res = await admin["client"].post(
        "/api/v1/call-logs",
        headers=admin["headers"],
        json={
            "business_id": biz_id,
            "duration": 120,
            "call_result": "interested",
            "notes": "Wants a website",
        },
    )
    assert res.status_code == 201
    assert res.json()["call_result"] == "interested"

    fresh = await admin["client"].get(
        f"/api/v1/businesses/{biz_id}", headers=admin["headers"]
    )
    assert fresh.json()["status"] == "interested"


@pytest.mark.asyncio
async def test_call_log_append_only_history(client):
    admin = await _setup_admin(client)
    biz = await _create_business(admin["client"], admin["headers"])
    biz_id = biz.json()["id"]

    for result in ["no_answer", "busy", "callback"]:
        res = await admin["client"].post(
            "/api/v1/call-logs",
            headers=admin["headers"],
            json={"business_id": biz_id, "call_result": result},
        )
        assert res.status_code == 201

    logs = await admin["client"].get(
        f"/api/v1/call-logs/business/{biz_id}", headers=admin["headers"]
    )
    assert logs.status_code == 200
    assert len(logs.json()) == 3


@pytest.mark.asyncio
async def test_schedule_follow_up(client):
    admin = await _setup_admin(client)
    biz = await _create_business(admin["client"], admin["headers"])
    biz_id = biz.json()["id"]

    res = await admin["client"].post(
        "/api/v1/follow-ups",
        headers=admin["headers"],
        json={
            "business_id": biz_id,
            "followup_date": "2026-10-01T10:00:00+00:00",
            "notes": "Call back re: SEO",
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "pending"

    res = await admin["client"].patch(
        f"/api/v1/follow-ups/{body['id']}/status",
        headers=admin["headers"],
        json={"status": "completed"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "completed"


@pytest.mark.asyncio
async def test_create_deal_and_close(client):
    admin = await _setup_admin(client)
    biz = await _create_business(admin["client"], admin["headers"])
    biz_id = biz.json()["id"]

    res = await admin["client"].post(
        "/api/v1/deals",
        headers=admin["headers"],
        json={
            "business_id": biz_id,
            "estimated_value": 50000,
            "closing_probability": 60,
        },
    )
    assert res.status_code == 201
    deal_id = res.json()["id"]

    res = await admin["client"].patch(
        f"/api/v1/deals/{deal_id}/status",
        headers=admin["headers"],
        json={"status": "closed_won"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "closed_won"


@pytest.mark.asyncio
async def test_dashboard_stats_exist(client):
    admin = await _setup_admin(client)
    biz = await _create_business(admin["client"], admin["headers"])
    biz_id = biz.json()["id"]
    await admin["client"].post(
        "/api/v1/call-logs",
        headers=admin["headers"],
        json={"business_id": biz_id, "call_result": "interested"},
    )

    res = await admin["client"].get(
        "/api/v1/dashboard/stats", headers=admin["headers"]
    )
    assert res.status_code == 200
    body = res.json()
    assert body["today_calls"] >= 1
    assert "revenue" in body
    assert "monthly_sales" in body


@pytest.mark.asyncio
async def test_export_csv_admin(client):
    admin = await _setup_admin(client)
    await _create_business(admin["client"], admin["headers"])

    res = await admin["client"].get(
        "/api/v1/businesses/export?format=csv", headers=admin["headers"]
    )
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    assert "business_name" in res.text


@pytest.mark.asyncio
async def test_analytics_admin_only(client):
    admin = await _setup_admin(client)
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Agent", "email": "agent@test.com", "password": "Agent@1234"},
    )
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "agent@test.com", "password": "Agent@1234"},
    )
    agent_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    res = await client.get(
        "/api/v1/analytics/conversion-funnel", headers=agent_headers
    )
    assert res.status_code == 403

    res = await client.get(
        "/api/v1/analytics/conversion-funnel", headers=admin["headers"]
    )
    assert res.status_code == 200