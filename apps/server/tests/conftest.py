"""Test harness: an in-memory SQLite database, a dependency-overridden session,
an httpx AsyncClient over the ASGI app, and a fake WLED so no hardware is
touched.
"""

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import src.core.metadata  # noqa: F401 — populate metadata
from src.core.database import Base, get_session
from src.main import create_app
from src.wled import client as wled


@pytest_asyncio.fixture
async def db_engine():
    # StaticPool + a single shared connection so the in-memory DB persists
    # across sessions within a test.
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_engine, monkeypatch):
    test_session = async_sessionmaker(
        db_engine, expire_on_commit=False, class_=AsyncSession
    )

    async def override_get_session():
        async with test_session() as session:
            yield session

    async def fake_fetch_info(_url, timeout=None):
        return wled.WLEDInfo(count=10, width=5, height=2)

    # Patch the attribute on the module so callers that do `wled.fetch_info`
    # pick up the fake.
    monkeypatch.setattr(wled, "fetch_info", fake_fetch_info)

    app = create_app()
    app.dependency_overrides[get_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
