"""Storganizer API application.

Wires the domain routers under /api, manages startup/shutdown (schema creation,
the device heartbeat loop, and the WARLS registry), and translates a couple of
cross-cutting database errors into clean HTTP responses.
"""

import asyncio
import contextlib
from collections.abc import AsyncIterator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

import src.core.metadata  # noqa: F401 — populate Base.metadata
from src.assignments.router import router as assignments_router
from src.cells.router import router as cells_router
from src.core.config import settings
from src.core.database import Base, SessionLocal, engine
from src.devices import service as devices_service
from src.devices.router import router as devices_router
from src.items.router import router as items_router
from src.tags.router import router as tags_router
from src.warls.registry import Registry
from src.warls.session import router as warls_router


async def _heartbeat_loop() -> None:
    """Ping all devices on a fixed cadence (replaces the PocketBase cron)."""
    while True:
        await asyncio.sleep(settings.heartbeat_interval_seconds)
        try:
            async with SessionLocal() as db:
                await devices_service.run_heartbeat(db)
        except Exception:  # noqa: BLE001 — never let the loop die
            pass


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    if settings.auto_create_db:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    app.state.warls_registry = Registry()
    heartbeat = asyncio.create_task(_heartbeat_loop())
    try:
        yield
    finally:
        heartbeat.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await heartbeat


def create_app() -> FastAPI:
    app = FastAPI(title="Storganizer API", version="0.2.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(IntegrityError)
    async def _integrity_error(_request: Request, _exc: IntegrityError) -> JSONResponse:
        # Unique-constraint violations (duplicate device/tag name, taken cell)
        # surface as 409 rather than an opaque 500.
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": "resource conflict (duplicate or constraint violation)"},
        )

    @app.get("/health", tags=["meta"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    api_routers = (
        devices_router,
        cells_router,
        items_router,
        assignments_router,
        tags_router,
    )
    for router in api_routers:
        app.include_router(router, prefix="/api")
    app.include_router(warls_router)  # already absolute (/api/warls/stream)

    return app


app = create_app()
