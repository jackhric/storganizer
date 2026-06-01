"""Cells REST API.

    GET  /cells?device_id=...           list a device's cells
    POST /devices/{id}/cells/sync       pull led_count from WLED, then create cells
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.cells import service
from src.cells.schemas import CellRead, CellSyncResult
from src.core.database import get_session
from src.devices import service as devices_service
from src.devices.exceptions import WLEDUnreachableError

router = APIRouter(tags=["cells"])


@router.get("/cells", response_model=list[CellRead])
async def list_cells(
    device_id: str = Query(...), db: AsyncSession = Depends(get_session)
):
    return await service.find_by_device(db, device_id)


@router.post("/devices/{device_id}/cells/sync", response_model=CellSyncResult)
async def sync_cells(device_id: str, db: AsyncSession = Depends(get_session)):
    try:
        device = await devices_service.sync(db, device_id)
    except WLEDUnreachableError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "WLED sync failed") from exc
    if device is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "device not found")
    count = await service.sync_cells(db, device_id)
    return CellSyncResult(count=count)
