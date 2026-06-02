"""Tag CRUD operations."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.items.models import Item
from src.tags.models import Tag


async def list_all(db: AsyncSession) -> list[Tag]:
    result = await db.execute(select(Tag).order_by(Tag.name))
    return list(result.scalars().all())


async def get(db: AsyncSession, tag_id: str) -> Tag | None:
    return await db.get(Tag, tag_id)


async def create(db: AsyncSession, *, name: str, color: str) -> Tag:
    tag = Tag(name=name, color=color)
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag


async def update(
    db: AsyncSession,
    tag_id: str,
    *,
    name: str | None = None,
    color: str | None = None,
) -> Tag | None:
    tag = await db.get(Tag, tag_id)
    if tag is None:
        return None
    if name is not None:
        tag.name = name
    if color is not None:
        tag.color = color
    await db.commit()
    await db.refresh(tag)
    return tag


async def delete(db: AsyncSession, tag_id: str) -> bool:
    tag = await db.get(Tag, tag_id)
    if tag is None:
        return False
    await db.delete(tag)
    await db.commit()
    return True


async def _resolve(
    db: AsyncSession, *, tag_ids: list[str], item_ids: list[str]
) -> tuple[list[Tag], list[Item]]:
    tags = list(
        (await db.execute(select(Tag).where(Tag.id.in_(tag_ids)))).scalars().all()
    )
    items = list(
        (
            await db.execute(
                select(Item)
                .where(Item.id.in_(item_ids))
                .options(selectinload(Item.tags))
            )
        )
        .scalars()
        .all()
    )
    return tags, items


async def apply_to_items(
    db: AsyncSession, *, tag_ids: list[str], item_ids: list[str]
) -> None:
    if not tag_ids or not item_ids:
        return
    tags, items = await _resolve(db, tag_ids=tag_ids, item_ids=item_ids)
    if not tags or not items:
        return
    for item in items:
        existing = {t.id for t in item.tags}
        for tag in tags:
            if tag.id not in existing:
                item.tags.append(tag)
    await db.commit()


async def remove_from_items(
    db: AsyncSession, *, tag_ids: list[str], item_ids: list[str]
) -> None:
    if not tag_ids or not item_ids:
        return
    _, items = await _resolve(db, tag_ids=tag_ids, item_ids=item_ids)
    drop = set(tag_ids)
    for item in items:
        item.tags = [t for t in item.tags if t.id not in drop]
    await db.commit()


async def merge(db: AsyncSession, *, source_id: str, target_id: str) -> bool:
    if source_id == target_id:
        return False
    source = await db.get(Tag, source_id)
    target = await db.get(Tag, target_id)
    if source is None or target is None:
        return False
    items = list(
        (
            await db.execute(
                select(Item)
                .join(Item.tags)
                .where(Tag.id == source_id)
                .options(selectinload(Item.tags))
            )
        )
        .scalars()
        .unique()
        .all()
    )
    for item in items:
        item.tags = [t for t in item.tags if t.id != source_id]
        if not any(t.id == target_id for t in item.tags):
            item.tags.append(target)
    await db.delete(source)
    await db.commit()
    return True
