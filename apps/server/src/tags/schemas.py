from pydantic import BaseModel

from src.core.schemas import TimestampedRead


class TagCreate(BaseModel):
    name: str
    color: str = ""


class TagUpdate(BaseModel):
    name: str | None = None
    color: str | None = None


class TagRead(TimestampedRead):
    name: str
    color: str
