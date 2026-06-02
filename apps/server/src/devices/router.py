"""Devices REST API. Hand-rolled (not FastCRUD) because create populates from
hardware, and there are extra sync/refresh actions.

    POST   /devices              create (probes WLED, derives cells)
    GET    /devices              list
    GET    /devices/{id}         read
    PATCH  /devices/{id}         rename
    DELETE /devices/{id}         delete (cascades to cells + assignments)
    POST   /devices/{id}/sync    re-pull LED geometry from WLED
    POST   /devices/refresh      run the heartbeat now
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.cells import service as cells_service
from src.core.database import get_session
from src.devices import service
from src.devices.exceptions import WLEDUnreachableError
from src.devices.schemas import (
    DeviceCreate,
    DeviceRead,
    DeviceSyncResult,
    DeviceUpdate,
)

router = APIRouter(prefix="/devices", tags=["devices"])

_UNREACHABLE = "Could not reach a WLED device at this address"


@router.post("", response_model=DeviceRead, status_code=status.HTTP_201_CREATED)
async def create_device(data: DeviceCreate, db: AsyncSession = Depends(get_session)):
    try:
        return await service.create(db, name=data.name, url=data.url)
    except WLEDUnreachableError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, _UNREACHABLE) from exc


@router.get("", response_model=list[DeviceRead])
async def list_devices(db: AsyncSession = Depends(get_session)):
    return await service.list_all(db)


@router.get("/{device_id}", response_model=DeviceRead)
async def get_device(device_id: str, db: AsyncSession = Depends(get_session)):
    device = await service.get(db, device_id)
    if device is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "device not found")
    return device


@router.patch("/{device_id}", response_model=DeviceRead)
async def update_device(
    device_id: str, data: DeviceUpdate, db: AsyncSession = Depends(get_session)
):
    if data.name is None:
        return await get_device(device_id, db)
    device = await service.update_name(db, device_id, data.name)
    if device is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "device not found")
    return device


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(device_id: str, db: AsyncSession = Depends(get_session)):
    if not await service.delete(db, device_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "device not found")


@router.post("/{device_id}/sync", response_model=DeviceSyncResult)
async def sync_device(device_id: str, db: AsyncSession = Depends(get_session)):
    try:
        device = await service.sync(db, device_id)
    except WLEDUnreachableError as exc:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "sync failed: WLED unreachable"
        ) from exc
    if device is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "device not found")
    await cells_service.sync_cells(db, device.id)
    return DeviceSyncResult(
        led_count=device.led_count,
        grid_width=device.grid_width,
        grid_height=device.grid_height,
    )


@router.post("/refresh", status_code=status.HTTP_204_NO_CONTENT)
async def refresh_devices(db: AsyncSession = Depends(get_session)):
    await service.run_heartbeat(db)
