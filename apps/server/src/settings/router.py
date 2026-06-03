"""Settings REST API.

    GET   /settings   read the global lighting settings
    PATCH /settings   update any subset of them
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.settings import service
from src.settings.schemas import SettingsRead, SettingsUpdate

router = APIRouter(tags=["settings"])


@router.get("/settings", response_model=SettingsRead)
async def get_settings(db: AsyncSession = Depends(get_session)):
    return await service.get_settings(db)


@router.patch("/settings", response_model=SettingsRead)
async def update_settings(
    payload: SettingsUpdate, db: AsyncSession = Depends(get_session)
):
    return await service.update_settings(db, payload)
