"""Assignments REST API.

    POST   /assignments                      create
    PATCH  /assignments/{id}                  update (cell and/or quantity)
    DELETE /assignments/{id}                  delete
    GET    /assignments/by-item/{item_id}     list, with cell + device expanded
    GET    /assignments/by-device/{dev_id}    list, with item + tags expanded
    POST   /assignments/move                  move/swap between cells
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.assignments import service
from src.assignments.exceptions import AssignmentError
from src.assignments.schemas import (
    AssignmentByDevice,
    AssignmentByItem,
    AssignmentCreate,
    AssignmentRead,
    AssignmentUpdate,
    MoveRequest,
)
from src.core.database import get_session

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.post("", response_model=AssignmentRead, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    data: AssignmentCreate, db: AsyncSession = Depends(get_session)
):
    return await service.create(db, data.item_id, data.cell_id, data.quantity)


@router.post("/move", status_code=status.HTTP_200_OK)
async def move_assignment(data: MoveRequest, db: AsyncSession = Depends(get_session)):
    try:
        await service.move_or_swap(db, data.from_cell_id, data.to_cell_id)
    except AssignmentError as exc:
        await db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"move failed: {exc}") from exc
    return {"ok": True}


@router.patch("/{assignment_id}", response_model=AssignmentRead)
async def update_assignment(
    assignment_id: str,
    data: AssignmentUpdate,
    db: AsyncSession = Depends(get_session),
):
    assignment = await service.update(
        db, assignment_id, cell_id=data.cell_id, quantity=data.quantity
    )
    if assignment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "assignment not found")
    return assignment


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: str, db: AsyncSession = Depends(get_session)
):
    if not await service.delete(db, assignment_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "assignment not found")


@router.get("/by-item/{item_id}", response_model=list[AssignmentByItem])
async def assignments_by_item(item_id: str, db: AsyncSession = Depends(get_session)):
    return await service.find_by_item(db, item_id)


@router.get("/by-device/{device_id}", response_model=list[AssignmentByDevice])
async def assignments_by_device(
    device_id: str, db: AsyncSession = Depends(get_session)
):
    return await service.find_by_device(db, device_id)
