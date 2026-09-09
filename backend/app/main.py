from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import Base, engine
from app.middleware.rate_limit import RateLimitMiddleware

# Import model modules so that their tables/enums are registered on Base.metadata
# before create_all runs (and so Alembic autogenerate can import them too).
from app.models import (  # noqa: E402,F401
    business,
    business_service,
    call_log,
    deal,
    follow_up,
    service,
    user,
)
from app.routers import (
    analytics,
    auth,
    businesses,
    call_logs,
    dashboard,
    deals,
    follow_ups,
    import_export,
    services,
    users,
)

settings = get_settings()

API_PREFIX = "/api/v1"


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"Lifespan table creation note: {e}")
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="CRM API",
        version="1.0.0",
        description=(
            "Production-grade CRM backend for lead management, "
            "calling, follow-ups, deals and analytics."
        ),
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    allowed_origins = [settings.FRONTEND_URL]
    for origin in ("http://localhost:5173", "http://127.0.0.1:5173"):
        if origin not in allowed_origins:
            allowed_origins.append(origin)

    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https://.*|http://localhost:\d+",
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    if settings.ENVIRONMENT != "testing":
        app.add_middleware(
            RateLimitMiddleware,
            limit=settings.RATE_LIMIT_PER_MINUTE,
        )

    app.include_router(auth.router, prefix=API_PREFIX)
    app.include_router(users.router, prefix=API_PREFIX)
    app.include_router(businesses.router, prefix=API_PREFIX)
    app.include_router(call_logs.router, prefix=API_PREFIX)
    app.include_router(follow_ups.router, prefix=API_PREFIX)
    app.include_router(deals.router, prefix=API_PREFIX)
    app.include_router(services.router, prefix=API_PREFIX)
    app.include_router(dashboard.router, prefix=API_PREFIX)
    app.include_router(import_export.router, prefix=API_PREFIX)
    app.include_router(analytics.router, prefix=API_PREFIX)

    @app.get("/health", tags=["health"])
    async def health_check() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
