"""Cell business logic.

Cells are insert-only here: a sync creates one cell per LED index that doesn't
already exist. Shrinking a device's led_count does not delete orphan cells
(deferred — destructive, and would cascade to assignments).
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.cells.models import Cell
from src.devices.models import Device


async def find_by_device(db: AsyncSession, device_id: str) -> list[Cell]:
    result = await db.execute(
        select(Cell).where(Cell.device_id == device_id).order_by(Cell.led_index)
    )
    return list(result.scalars().all())


async def sync_cells(db: AsyncSession, device_id: str) -> int:
    """Ensure a cell exists for every LED on the device. Returns the total
    cell count for the device after syncing."""
    device = await db.get(Device, device_id)
    if device is None or device.led_count == 0:
        return 0

    existing = await find_by_device(db, device_id)
    taken = {c.led_index for c in existing}

    for index in range(device.led_count):
        if index in taken:
            continue
        db.add(Cell(device_id=device_id, led_index=index))

    await db.commit()
    return len(await find_by_device(db, device_id))
