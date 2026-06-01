"""Assignment schemas, including the two "expanded" read shapes that replace
PocketBase's `expand` query parameter:

  * AssignmentByItem   — each assignment with its cell (and the cell's device)
  * AssignmentByDevice — each assignment with its item (and the item's tags)

Nested leaf schemas (DeviceRead, CellRead, TagRead) are imported here; the item
shape is defined locally to avoid an import cycle with items.schemas.
"""

from typing import Any

from pydantic import BaseModel

from src.cells.schemas import CellRead
from src.core.schemas import TimestampedRead
from src.devices.schemas import DeviceRead
from src.tags.schemas import TagRead


class AssignmentCreate(BaseModel):
    item_id: str
    cell_id: str
    quantity: int = 0


class AssignmentUpdate(BaseModel):
    cell_id: str | None = None
    quantity: int | None = None


class AssignmentRead(TimestampedRead):
    item_id: str
    cell_id: str
    quantity: int


class CellWithDevice(CellRead):
    device: DeviceRead | None = None


class AssignmentByItem(AssignmentRead):
    cell: CellWithDevice | None = None


class ItemWithTags(TimestampedRead):
    name: str
    image: str
    store_url: str
    notes: str
    external_links: Any | None = None
    tags: list[TagRead] = []


class AssignmentByDevice(AssignmentRead):
    item: ItemWithTags | None = None


class MoveRequest(BaseModel):
    from_cell_id: str
    to_cell_id: str
