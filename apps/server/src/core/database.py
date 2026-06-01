"""Database engine, session factory, and the FastAPI session dependency.

Everything async: an `AsyncEngine` over aiosqlite, an async sessionmaker, and
`get_session` for dependency injection into routers. Tests override
`get_session` to point at an in-memory database.
"""

from collections.abc import AsyncGenerator

from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from src.core.config import settings


class Base(DeclarativeBase):
    """Declarative base shared by every ORM model."""


engine = create_async_engine(settings.database_url, future=True)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


@event.listens_for(Engine, "connect")
def _enable_sqlite_fks(dbapi_connection, _record):
    """SQLite ignores foreign keys (and thus ON DELETE CASCADE) unless asked.

    Enable the pragma on every connection so cascade deletes — device → cells →
    assignments, item → assignments — actually fire.
    """
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a request-scoped async session."""
    async with SessionLocal() as session:
        yield session
