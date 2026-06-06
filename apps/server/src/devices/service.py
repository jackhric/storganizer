"""Device business logic.

This is where two former PocketBase record hooks now live as explicit steps:
  * the OnRecordCreate hook that populated a device from WLED, and
  * the cells after-create/after-update hook that derived cells.
Both fire here, in `create`, so the control flow is visible and testable.
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.devices import storage
from src.devices.exceptions import WLEDUnreachableError
from src.devices.models import Device
from src.wled import client as wled


def _utcnow() -> datetime:
    return datetime.now(UTC)


async def get(db: AsyncSession, device_id: str) -> Device | None:
    return await db.get(Device, device_id)


async def list_all(db: AsyncSession) -> list[Device]:
    result = await db.execute(select(Device).order_by(Device.name))
    return list(result.scalars().all())


async def create(db: AsyncSession, name: str, url: str) -> Device:
    """Register a device.

    Reaches the hardware first (rejecting unreachable URLs), populates LED
    geometry, persists, then derives one cell per LED.
    """
    try:
        info = await wled.fetch_info(url)
    except Exception as exc:  # noqa: BLE001 — any failure means "unreachable"
        raise WLEDUnreachableError(url) from exc

    device = Device(
        name=name,
        url=url,
        led_count=info.count,
        grid_width=info.width,
        grid_height=info.height,
        is_online=True,
        last_seen=_utcnow(),
    )
    db.add(device)
    await db.commit()
    await db.refresh(device)

    # Former cells-module hook: derive cells from the live led_count.
    from src.cells import service as cells_service

    await cells_service.sync_cells(db, device.id)
    return device


async def update_name(db: AsyncSession, device_id: str, name: str) -> Device | None:
    device = await db.get(Device, device_id)
    if device is None:
        return None
    device.name = name
    await db.commit()
    await db.refresh(device)
    return device


async def set_icon(
    db: AsyncSession, device_id: str, filename: str, data: bytes
) -> Device | None:
    device = await db.get(Device, device_id)
    if device is None:
        return None
    # save_icon rmtree-overwrites the device dir, so the previous icon is cleaned.
    device.icon = storage.save_icon(device_id, filename, data)
    await db.commit()
    await db.refresh(device)
    return device


async def delete(db: AsyncSession, device_id: str) -> bool:
    device = await db.get(Device, device_id)
    if device is None:
        return False
    await db.delete(device)
    await db.commit()
    storage.delete_icon(device_id)
    return True


async def sync(db: AsyncSession, device_id: str) -> Device | None:
    """Pull live LED geometry from WLED and write it back to the record."""
    device = await db.get(Device, device_id)
    if device is None:
        return None
    try:
        info = await wled.fetch_info(device.url)
    except Exception as exc:  # noqa: BLE001
        raise WLEDUnreachableError(device.url) from exc

    device.led_count = info.count
    device.grid_width = info.width
    device.grid_height = info.height
    device.is_online = True
    device.last_seen = _utcnow()
    await db.commit()
    await db.refresh(device)
    return device


async def run_heartbeat(db: AsyncSession) -> None:
    """Ping every device concurrently and update online state.

    The network round-trips overlap via asyncio.gather; the in-memory attribute
    writes don't touch the session connection, and the single commit happens
    after all pings resolve — so the shared session is never used concurrently.
    """
    devices = await list_all(db)
    if not devices:
        return
    await asyncio.gather(*(_ping(device) for device in devices))
    await db.commit()


async def _ping(device: Device) -> None:
    try:
        info = await wled.fetch_info(device.url)
    except Exception:  # noqa: BLE001
        device.is_online = False
        return
    device.is_online = True
    device.last_seen = _utcnow()
    device.led_count = info.count
    device.grid_width = info.width
    device.grid_height = info.height
