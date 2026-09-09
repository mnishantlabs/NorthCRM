"""Tests for the authentication flow (register, login, refresh, RBAC)."""
from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_register_first_user_is_admin(client) -> None:
    res = await client.post(
        "/api/v1/auth/register",
        json={"name": "Admin", "email": "admin@test.com", "password": "Test@1234"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["email"] == "admin@test.com"
    assert body["role"] == "admin"
    assert "password" not in body


@pytest.mark.asyncio
async def test_register_second_user_is_agent(client) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Admin", "email": "admin@test.com", "password": "Test@1234"},
    )
    res = await client.post(
        "/api/v1/auth/register",
        json={"name": "Agent", "email": "agent@test.com", "password": "Test@1234"},
    )
    assert res.status_code == 201
    assert res.json()["role"] == "agent"


@pytest.mark.asyncio
async def test_register_duplicate_email_conflicts(client) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Admin", "email": "admin@test.com", "password": "Test@1234"},
    )
    res = await client.post(
        "/api/v1/auth/register",
        json={"name": "Dup", "email": "admin@test.com", "password": "Test@5678"},
    )
    assert res.status_code in (400, 409)


@pytest.mark.asyncio
async def test_login_success_returns_tokens(client) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Admin", "email": "admin@test.com", "password": "Test@1234"},
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "Test@1234"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["user"]["email"] == "admin@test.com"


@pytest.mark.asyncio
async def test_login_wrong_password_rejected(client) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Admin", "email": "admin@test.com", "password": "Test@1234"},
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "wrong-password"},
    )
    assert res.status_code == 401
    assert res.json()["detail"] == "Incorrect email or password"


@pytest.mark.asyncio
async def test_me_returns_authenticated_user(client) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Admin", "email": "admin@test.com", "password": "Test@1234"},
    )
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "Test@1234"},
    )
    token = login.json()["access_token"]
    res = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert res.json()["email"] == "admin@test.com"


@pytest.mark.asyncio
async def test_refresh_returns_new_tokens(client) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Admin", "email": "admin@test.com", "password": "Test@1234"},
    )
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "Test@1234"},
    )
    refresh = login.json()["refresh_token"]
    res = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh}
    )
    assert res.status_code == 200
    assert res.json()["access_token"]


@pytest.mark.asyncio
async def test_me_without_token_unauthenticated(client) -> None:
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_with_invalid_token_rejected(client) -> None:
    res = await client.get(
        "/api/v1/auth/me", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_register_short_password_rejected(client) -> None:
    res = await client.post(
        "/api/v1/auth/register",
        json={"name": "A", "email": "a@test.com", "password": "short"},
    )
    assert res.status_code == 422