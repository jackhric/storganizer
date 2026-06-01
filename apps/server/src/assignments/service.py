"""Assignment business logic, including the move/swap that the unique
constraint on cell_id makes non-trivial.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.assignments.exceptions import AssignmentError
from src.assignments.models import Assignment
from src.cells.models import Cell
from src.items.models import Item


async def get(db: AsyncSession, assignment_id: str) -> Assignment | None:
    return await db.get(Assignment, assignment_id)


async def find_by_cell(db: AsyncSession, cell_id: str) -> Assignment | None:
    result = await db.execute(select(Assignment).where(Assignment.cell_id == cell_id))
    return result.scalars().first()


async def find_by_item(db: AsyncSession, item_id: str) -> list[Assignment]:
    """Assignments for an item, each with its cell and that cell's device
    eagerly loaded (replaces expand=cell_id,cell_id.device_id)."""
    result = await db.execute(
        select(Assignment)
        .where(Assignment.item_id == item_id)
        .options(selectinload(Assignment.cell).selectinload(Cell.device))
    )
    return list(result.scalars().all())


async def find_by_device(db: AsyncSession, device_id: str) -> list[Assignment]:
    """Assignments on a device's cells, each with its item and the item's tags
    eagerly loaded (replaces expand=item_id,item_id.tags)."""
    result = await db.execute(
        select(Assignment)
        .join(Cell, Assignment.cell_id == Cell.id)
        .where(Cell.device_id == device_id)
        .options(selectinload(Assignment.item).selectinload(Item.tags))
    )
    return list(result.scalars().all())


async def create(db: AsyncSession, item_id: str, cell_id: str, quantity: int) -> Assignment:
    assignment = Assignment(item_id=item_id, cell_id=cell_id, quantity=quantity)
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment


async def update(
    db: AsyncSession,
    assignment_id: str,
    *,
    cell_id: str | None = None,
    quantity: int | None = None,
) -> Assignment | None:
    assignment = await db.get(Assignment, assignment_id)
    if assignment is None:
        return None
    if cell_id is not None:
        assignment.cell_id = cell_id
    if quantity is not None:
        assignment.quantity = quantity
    await db.commit()
    await db.refresh(assignment)
    return assignment


async def delete(db: AsyncSession, assignment_id: str) -> bool:
    assignment = await db.get(Assignment, assignment_id)
    if assignment is None:
        return False
    await db.delete(assignment)
    await db.commit()
    return True


async def move_or_swap(db: AsyncSession, from_cell_id: str, to_cell_id: str) -> None:
    """Move the assignment at from_cell_id onto to_cell_id.

    If to_cell_id is empty, just reassign. If it's occupied, swap the two.
    The unique index on cell_id means an in-place swap collides mid-flush, so
    we delete the target, move the source, then recreate the target on the
    source's old cell — all in one transaction.
    """
    if not from_cell_id or not to_cell_id:
        raise AssignmentError("from_cell_id and to_cell_id are required")
    if from_cell_id == to_cell_id:
        return

    source = await find_by_cell(db, from_cell_id)
    if source is None:
        raise AssignmentError("no assignment found at from_cell_id")

    target = await find_by_cell(db, to_cell_id)
    if target is None:
        source.cell_id = to_cell_id
        await db.commit()
        return

    target_item_id = target.item_id
    target_quantity = target.quantity

    await db.delete(target)
    await db.flush()

    source.cell_id = to_cell_id
    await db.flush()

    db.add(
        Assignment(
            item_id=target_item_id,
            cell_id=from_cell_id,
            quantity=target_quantity,
        )
    )
    await db.commit()
