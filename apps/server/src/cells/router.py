"""Cells REST API.

    GET  /cells?device_id=...   list a device's cells
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.cells import service
from src.cells.schemas import CellRead
from src.core.database import get_session

router = APIRouter(tags=["cells"])


@router.get("/cells", response_model=list[CellRead])
async def list_cells(
    device_id: str = Query(...), db: AsyncSession = Depends(get_session)
):
    return await service.find_by_device(db, device_id)
