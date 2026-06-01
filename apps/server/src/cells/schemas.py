from pydantic import BaseModel

from src.core.schemas import TimestampedRead


class CellRead(TimestampedRead):
    device_id: str
    led_index: int | None
    label: str


class CellSyncResult(BaseModel):
    count: int
