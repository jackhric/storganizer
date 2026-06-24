"""Item image storage and thumbnail generation.

PocketBase gave us file storage and on-the-fly thumbnails for free; this is the
hand-rolled replacement built on Pillow. Originals live at
    {storage_dir}/items/{item_id}/{filename}
and generated thumbnails are cached alongside at
    {storage_dir}/items/{item_id}/thumbs/{w}x{h}_{filename}

Pillow calls are synchronous/CPU-bound — callers run them off the event loop.
"""

from __future__ import annotations

import re
import shutil
from pathlib import Path

from PIL import Image

from src.core.config import settings

_SAFE = re.compile(r"[^A-Za-z0-9._-]+")
_SIZE = re.compile(r"^(\d{1,4})x(\d{1,4})$")


def _item_dir(item_id: str) -> Path:
    return settings.storage_dir / "items" / item_id


def sanitize_filename(filename: str) -> str:
    name = _SAFE.sub("_", Path(filename).name).strip("_")
    return name or "image"


def save_image(item_id: str, filename: str, data: bytes) -> str:
    """Persist the original upload, replacing any previous image. Returns the
    stored (sanitized) filename."""
    directory = _item_dir(item_id)
    if directory.exists():
        shutil.rmtree(directory)
    directory.mkdir(parents=True, exist_ok=True)

    safe = sanitize_filename(filename)
    (directory / safe).write_bytes(data)
    return safe


def original_path(item_id: str, filename: str) -> Path | None:
    path = _item_dir(item_id) / sanitize_filename(filename)
    return path if path.exists() else None


def thumbnail_path(item_id: str, filename: str, size: str) -> Path | None:
    """Return a cached thumbnail at the requested WxH, generating it on first
    request. Returns None if the original is missing or the size is malformed."""
    match = _SIZE.match(size)
    src = original_path(item_id, filename)
    if match is None or src is None:
        return None

    width, height = int(match.group(1)), int(match.group(2))
    safe = sanitize_filename(filename)
    cache_dir = _item_dir(item_id) / "thumbs"
    cache_dir.mkdir(parents=True, exist_ok=True)
    dst = cache_dir / f"{width}x{height}_{safe}"

    if not dst.exists():
        with Image.open(src) as img:
            # JPEG has no alpha; flatten transparency onto white instead of the
            # default black so transparent PNGs don't render on a black square.
            if img.mode in ("RGBA", "LA") or (
                img.mode == "P" and "transparency" in img.info
            ):
                rgba = img.convert("RGBA")
                background = Image.new("RGB", rgba.size, (255, 255, 255))
                background.paste(rgba, mask=rgba.split()[-1])
                img = background
            else:
                img = img.convert("RGB")
            img.thumbnail((width, height))
            img.save(dst, format="JPEG", quality=85)
    return dst


def delete_image(item_id: str) -> None:
    directory = _item_dir(item_id)
    if directory.exists():
        shutil.rmtree(directory)
