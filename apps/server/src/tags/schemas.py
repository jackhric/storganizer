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


class TagItemsRequest(BaseModel):
    tag_ids: list[str]
    item_ids: list[str]


class TagMergeRequest(BaseModel):
    source_id: str
    target_id: str
