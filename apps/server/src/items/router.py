"""Items REST API. Create/update are multipart (an optional image plus form
fields); list/get return the expanded shape; the image endpoint serves
originals and on-demand thumbnails.

    GET    /items?q=                list (tags + assignments expanded)
    GET    /items/random?limit=     up to `limit` (max 10) random items
    GET    /items/{id}              read
    POST   /items                   create (multipart)
    PATCH  /items/{id}              update (multipart, all fields optional)
    DELETE /items/{id}              delete (removes image files too)
    PATCH  /items/{id}/tags         replace an item's tags
    GET    /items/{id}/image?size=  serve original or WxH thumbnail
"""

import json
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.items import service, storage
from src.items.schemas import ItemRead, ItemTagsUpdate

router = APIRouter(prefix="/items", tags=["items"])


def _parse_json_field(raw: str | None, default: Any) -> Any:
    if raw is None or raw == "":
        return default
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "invalid JSON field"
        ) from exc


@router.get("", response_model=list[ItemRead])
async def list_items(q: str | None = None, db: AsyncSession = Depends(get_session)):
    return await service.list_items(db, search=q)


@router.get("/random", response_model=list[ItemRead])
async def random_items(
    limit: int = Query(10, ge=1, le=10), db: AsyncSession = Depends(get_session)
):
    return await service.list_random(db, limit=limit)


@router.get("/{item_id}", response_model=ItemRead)
async def get_item(item_id: str, db: AsyncSession = Depends(get_session)):
    item = await service.get(db, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "item not found")
    return item


@router.post("", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
async def create_item(
    name: str = Form(...),
    store_url: str = Form(""),
    notes: str = Form(""),
    external_links: str | None = Form(None),
    tags: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_session),
):
    image_bytes = await image.read() if image is not None else None
    return await service.create(
        db,
        name=name,
        store_url=store_url,
        notes=notes,
        external_links=_parse_json_field(external_links, None),
        tag_ids=_parse_json_field(tags, []),
        image_filename=image.filename if image is not None else None,
        image_bytes=image_bytes,
    )


@router.patch("/{item_id}", response_model=ItemRead)
async def update_item(
    item_id: str,
    name: str | None = Form(None),
    store_url: str | None = Form(None),
    notes: str | None = Form(None),
    external_links: str | None = Form(None),
    tags: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_session),
):
    image_bytes = await image.read() if image is not None else None
    item = await service.update(
        db,
        item_id,
        name=name,
        store_url=store_url,
        notes=notes,
        external_links=_parse_json_field(external_links, None),
        external_links_set=external_links is not None,
        tag_ids=_parse_json_field(tags, None) if tags is not None else None,
        image_filename=image.filename if image is not None else None,
        image_bytes=image_bytes,
    )
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "item not found")
    return item


@router.patch("/{item_id}/tags", response_model=ItemRead)
async def update_item_tags(
    item_id: str, data: ItemTagsUpdate, db: AsyncSession = Depends(get_session)
):
    item = await service.set_tags(db, item_id, data.tag_ids)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "item not found")
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: str, db: AsyncSession = Depends(get_session)):
    if not await service.delete(db, item_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "item not found")


@router.get("/{item_id}/image")
async def get_item_image(
    item_id: str, size: str | None = None, db: AsyncSession = Depends(get_session)
):
    item = await service.get(db, item_id)
    if item is None or not item.image:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no image")

    if size:
        path = await run_in_threadpool(
            storage.thumbnail_path, item_id, item.image, size
        )
        if path is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "bad size or missing image")
        return FileResponse(path, media_type="image/jpeg")

    path = storage.original_path(item_id, item.image)
    if path is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no image")
    return FileResponse(path)
