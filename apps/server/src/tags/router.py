"""Tags REST API.

    GET    /tags            list (sorted by name)
    GET    /tags/{id}       read
    POST   /tags            create
    PATCH  /tags/{id}       update
    DELETE /tags/{id}       delete
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.tags import service
from src.tags.schemas import TagCreate, TagRead, TagUpdate

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagRead])
async def list_tags(db: AsyncSession = Depends(get_session)):
    return await service.list_all(db)


@router.get("/{tag_id}", response_model=TagRead)
async def get_tag(tag_id: str, db: AsyncSession = Depends(get_session)):
    tag = await service.get(db, tag_id)
    if tag is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "tag not found")
    return tag


@router.post("", response_model=TagRead, status_code=status.HTTP_201_CREATED)
async def create_tag(data: TagCreate, db: AsyncSession = Depends(get_session)):
    return await service.create(db, name=data.name, color=data.color)


@router.patch("/{tag_id}", response_model=TagRead)
async def update_tag(
    tag_id: str, data: TagUpdate, db: AsyncSession = Depends(get_session)
):
    tag = await service.update(db, tag_id, name=data.name, color=data.color)
    if tag is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "tag not found")
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(tag_id: str, db: AsyncSession = Depends(get_session)):
    if not await service.delete(db, tag_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "tag not found")
