from datetime import datetime

from pydantic import BaseModel

from src.core.schemas import TimestampedRead


class DeviceCreate(BaseModel):
    """What a client may set. led_count/grid/online state are derived from the
    hardware, never accepted from the client."""

    name: str
    url: str


class DeviceUpdate(BaseModel):
    name: str | None = None


class DeviceRead(TimestampedRead):
    name: str
    url: str
    led_count: int
    grid_width: int
    grid_height: int
    is_online: bool
    last_seen: datetime | None


class DeviceSyncResult(BaseModel):
    led_count: int
    grid_width: int
    grid_height: int
