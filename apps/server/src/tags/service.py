"""Tag CRUD operations."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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
