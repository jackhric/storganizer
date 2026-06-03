"""Settings business logic.

A single global row holds app-wide lighting configuration. `get_settings`
lazily creates it on first read so callers never have to special-case a missing
row; `update_settings` patches whichever fields a client provided.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from src.settings.models import SINGLETON_ID, Settings
from src.settings.schemas import SettingsUpdate


async def get_settings(db: AsyncSession) -> Settings:
    """Return the global settings row, creating it with defaults if absent."""
    settings = await db.get(Settings, SINGLETON_ID)
    if settings is None:
        settings = Settings(id=SINGLETON_ID)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


async def update_settings(db: AsyncSession, payload: SettingsUpdate) -> Settings:
    """Patch the provided fields on the global settings row."""
    settings = await get_settings(db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    await db.commit()
    await db.refresh(settings)
    return settings
