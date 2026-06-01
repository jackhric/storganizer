"""Item schemas. ItemRead carries the expanded relations the inventory views
need — tags, and assignments with their cell + device — replacing PocketBase's
expand=assignments_via_item_id.cell_id,tags.
"""

from typing import Any

from pydantic import BaseModel

from src.assignments.schemas import AssignmentByItem
from src.core.schemas import TimestampedRead
from src.tags.schemas import TagRead


class ItemRead(TimestampedRead):
    name: str
    image: str
    store_url: str
    notes: str
    external_links: Any | None = None
    tags: list[TagRead] = []
    assignments: list[AssignmentByItem] = []


class ItemTagsUpdate(BaseModel):
    tag_ids: list[str]
