"""Item business logic: CRUD plus tag wiring and image persistence.

The expanded reads use selectinload so a list of items carries its tags,
assignments, cells and devices in a fixed number of queries.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.assignments.models import Assignment
from src.cells.models import Cell
from src.items import storage
from src.items.models import Item
from src.tags.models import Tag

_EXPAND = (
    selectinload(Item.tags),
    selectinload(Item.assignments)
    .selectinload(Assignment.cell)
    .selectinload(Cell.device),
)


async def _load_expanded(db: AsyncSession, item_id: str) -> Item | None:
    result = await db.execute(
        select(Item).where(Item.id == item_id).options(*_EXPAND)
    )
    return result.scalars().first()


async def list_items(db: AsyncSession, search: str | None = None) -> list[Item]:
    stmt = select(Item).options(*_EXPAND).order_by(Item.name)
    if search:
        stmt = stmt.where(Item.name.ilike(f"%{search}%"))
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def list_random(db: AsyncSession, limit: int = 10) -> list[Item]:
    stmt = select(Item).options(*_EXPAND).order_by(func.random()).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get(db: AsyncSession, item_id: str) -> Item | None:
    return await _load_expanded(db, item_id)


async def _resolve_tags(db: AsyncSession, tag_ids: list[str]) -> list[Tag]:
    if not tag_ids:
        return []
    result = await db.execute(select(Tag).where(Tag.id.in_(tag_ids)))
    return list(result.scalars().all())


async def create(
    db: AsyncSession,
    *,
    name: str,
    store_url: str = "",
    notes: str = "",
    external_links: Any | None = None,
    tag_ids: list[str] | None = None,
    image_filename: str | None = None,
    image_bytes: bytes | None = None,
) -> Item:
    item = Item(
        name=name,
        store_url=store_url,
        notes=notes,
        external_links=external_links,
        tags=await _resolve_tags(db, tag_ids or []),
    )
    db.add(item)
    await db.flush()  # assign item.id before writing files

    if image_bytes is not None and image_filename:
        item.image = storage.save_image(item.id, image_filename, image_bytes)

    await db.commit()
    return await _load_expanded(db, item.id)


async def update(
    db: AsyncSession,
    item_id: str,
    *,
    name: str | None = None,
    store_url: str | None = None,
    notes: str | None = None,
    external_links: Any | None = None,
    external_links_set: bool = False,
    tag_ids: list[str] | None = None,
    image_filename: str | None = None,
    image_bytes: bytes | None = None,
) -> Item | None:
    item = await db.get(Item, item_id)
    if item is None:
        return None

    if name is not None:
        item.name = name
    if store_url is not None:
        item.store_url = store_url
    if notes is not None:
        item.notes = notes
    if external_links_set:
        item.external_links = external_links
    if tag_ids is not None:
        item.tags = await _resolve_tags(db, tag_ids)
    if image_bytes is not None and image_filename:
        item.image = storage.save_image(item.id, image_filename, image_bytes)

    await db.commit()
    return await _load_expanded(db, item_id)


async def set_tags(db: AsyncSession, item_id: str, tag_ids: list[str]) -> Item | None:
    item = await db.get(Item, item_id)
    if item is None:
        return None
    item.tags = await _resolve_tags(db, tag_ids)
    await db.commit()
    return await _load_expanded(db, item_id)


async def delete(db: AsyncSession, item_id: str) -> bool:
    item = await db.get(Item, item_id)
    if item is None:
        return False
    await db.delete(item)
    await db.commit()
    storage.delete_image(item_id)
    return True
