"""Seed the database with default services and an initial admin user.

Usage:
    python -m app.seed
"""
from __future__ import annotations

import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models import (  # noqa: F401
    business,
    business_service,
    call_log,
    deal,
    follow_up,
    service,
    user,
)
from app.models.service import Service
from app.models.user import User, UserRole

DEFAULT_SERVICES: list[tuple[str, str]] = [
    ("Website Development", "Custom, responsive websites built to convert."),
    ("Website Redesign", "Modern redesigns that improve UX and performance."),
    ("SEO", "Search engine optimization to rank higher and drive organic traffic."),
    ("Google Business Profile Optimization", "Optimize your listing to win local searches."),
    ("Google Ads", "Targeted pay-per-click campaigns on Google Search & Display."),
    ("Meta Ads", "Social advertising on Facebook & Instagram."),
    ("Hosting", "Fast, secure and reliable web hosting."),
    ("Website Maintenance", "Ongoing updates, backups, security and support."),
    ("Custom Software Development", "Tailor-made software solutions for your business."),
    ("Digital Marketing", "Full-funnel marketing strategy and execution."),
]

DEFAULT_ADMIN = {
    "name": "Admin",
    "email": "admin@crm.local",
    "password": "Admin@1234",
    "role": UserRole.ADMIN,
}


async def seed() -> None:
    async with AsyncSessionLocal() as db:  # type: AsyncSession
        existing = list((await db.execute(select(Service.name))).scalars().all())
        created = 0
        for name, description in DEFAULT_SERVICES:
            if name not in existing:
                db.add(Service(name=name, description=description))
                created += 1

        admin_user = (
            await db.execute(select(User).where(User.email == DEFAULT_ADMIN["email"]))
        ).scalar_one_or_none()
        if admin_user is None:
            db.add(
                User(
                    name=DEFAULT_ADMIN["name"],
                    email=DEFAULT_ADMIN["email"],
                    password_hash=hash_password(DEFAULT_ADMIN["password"]),
                    role=DEFAULT_ADMIN["role"],
                )
            )
            print(f"Created admin user: {DEFAULT_ADMIN['email']}")
        else:
            print("Admin user already exists")

        await db.commit()
        print(f"Services: {created} created, {len(existing)} already present")
        print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())