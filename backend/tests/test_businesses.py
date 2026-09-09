"""Tests for business management: CRUD, RBAC, status updates, assignment."""
from __future__ import annotations

import pytest


async def _create_business(client, headers, **overrides):
    payload = {
        "business_name": "Acme Corp",
        "owner_name": "John Doe",
        "phone": "+1-555-0100",
        "email": "hello@acme.com",
        "website": "https://acme.com",
        "category": "Restaurant",
        "city": "Mumbai",
    }
    payload.update(overrides)
    return await client.post("/api/v1/businesses", headers=headers, json=payload)


@pytest.mark.asyncio
async def test_create_business_admin(client):
    fx = await _setup_admin(client)
    res = await _create_business(fx["client"], fx["headers"])
    assert res.status_code == 201
    body = res.json()
    assert body["business_name"] == "Acme Corp"
    assert body["status"] == "new"


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


async def _setup_agent(client):
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Admin", "email": "admin@test.com", "password": "Test@1234"},
    )
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Agent", "email": "agent@test.com", "password": "Agent@1234"},
    )
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "agent@test.com", "password": "Agent@1234"},
    )
    return {
        "client": client,
        "headers": {"Authorization": f"Bearer {login.json()['access_token']}"},
    }


@pytest.mark.asyncio
async def test_agent_cannot_create_business(client):
    fx = await _setup_agent(client)
    res = await _create_business(fx["client"], fx["headers"])
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_list_businesses_paginated(client):
    fx = await _setup_admin(client)
    for i in range(5):
        await _create_business(fx["client"], fx["headers"], business_name=f"Biz {i}")
    res = await fx["client"].get(
        "/api/v1/businesses?page=1&per_page=2", headers=fx["headers"]
    )
    assert res.status_code == 200
    body = res.json()
    assert len(body["items"]) == 2
    assert body["total"] == 5
    assert body["pages"] == 3


@pytest.mark.asyncio
async def test_search_businesses(client):
    fx = await _setup_admin(client)
    await _create_business(fx["client"], fx["headers"], business_name="Unique Diner")
    await _create_business(fx["client"], fx["headers"], business_name="Other Shop")
    res = await fx["client"].get(
        "/api/v1/businesses?search=Unique", headers=fx["headers"]
    )
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["business_name"] == "Unique Diner"


@pytest.mark.asyncio
async def test_update_status_and_filter_by_status(client):
    fx = await _setup_admin(client)
    created = await _create_business(fx["client"], fx["headers"])
    biz_id = created.json()["id"]

    res = await fx["client"].patch(
        f"/api/v1/businesses/{biz_id}/status",
        headers=fx["headers"],
        json={"status": "interested"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "interested"

    res = await fx["client"].get(
        "/api/v1/businesses?status=interested", headers=fx["headers"]
    )
    assert res.json()["total"] == 1


@pytest.mark.asyncio
async def test_assign_agent_and_scoped_list(client):
    admin = await _setup_admin(client)
    await admin["client"].post(
        "/api/v1/users",
        headers=admin["headers"],
        json={"name": "Agent", "email": "agent@test.com", "password": "Agent@1234"},
    )
    users = await admin["client"].get("/api/v1/users", headers=admin["headers"])
    agent = next(u for u in users.json()["items"] if u["role"] == "agent")
    agent_id = agent["id"]

    created = await _create_business(admin["client"], admin["headers"])
    biz_id = created.json()["id"]

    res = await admin["client"].patch(
        f"/api/v1/businesses/{biz_id}/assign",
        headers=admin["headers"],
        json={"agent_id": agent_id},
    )
    assert res.status_code == 200
    assert res.json()["assigned_agent"]["id"] == agent_id

    agent_fx = await _setup_agent(admin["client"])
    list_res = await agent_fx["client"].get("/api/v1/businesses", headers=agent_fx["headers"])
    assert list_res.status_code == 200
    assert len(list_res.json()["items"]) == 1


@pytest.mark.asyncio
async def test_agent_cannot_access_unassigned_business(client):
    admin = await _setup_admin(client)
    created = await _create_business(admin["client"], admin["headers"])
    biz_id = created.json()["id"]

    agent_fx = await _setup_agent(admin["client"])
    res = await agent_fx["client"].get(
        f"/api/v1/businesses/{biz_id}", headers=agent_fx["headers"]
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_delete_business_admin_only(client):
    admin = await _setup_admin(client)
    created = await _create_business(admin["client"], admin["headers"])
    biz_id = created.json()["id"]

    agent_fx = await _setup_agent(admin["client"])
    res = await agent_fx["client"].delete(
        f"/api/v1/businesses/{biz_id}", headers=agent_fx["headers"]
    )
    assert res.status_code == 403

    res = await admin["client"].delete(
        f"/api/v1/businesses/{biz_id}", headers=admin["headers"]
    )
    assert res.status_code == 204


@pytest.mark.asyncio
async def test_get_missing_business_404(client):
    fx = await _setup_admin(client)
    res = await fx["client"].get(
        "/api/v1/businesses/00000000-0000-0000-0000-000000000000",
        headers=fx["headers"],
    )
    assert res.status_code == 404