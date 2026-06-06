"""Device icon storage.

Mirrors items.storage, but icons are served as the original file (no thumbnail
resizing) so animated GIFs keep animating — the frontend constrains the render
size in CSS. Originals live at
    {storage_dir}/devices/{device_id}/{filename}
"""

from __future__ import annotations

import re
import shutil
from pathlib import Path

from src.core.config import settings

_SAFE = re.compile(r"[^A-Za-z0-9._-]+")


def _device_dir(device_id: str) -> Path:
    return settings.storage_dir / "devices" / device_id


def sanitize_filename(filename: str) -> str:
    name = _SAFE.sub("_", Path(filename).name).strip("_")
    return name or "icon"


def save_icon(device_id: str, filename: str, data: bytes) -> str:
    """Persist the icon, replacing any previous one. Returns the stored
    (sanitized) filename."""
    directory = _device_dir(device_id)
    if directory.exists():
        shutil.rmtree(directory)
    directory.mkdir(parents=True, exist_ok=True)

    safe = sanitize_filename(filename)
    (directory / safe).write_bytes(data)
    return safe


def original_path(device_id: str, filename: str) -> Path | None:
    path = _device_dir(device_id) / sanitize_filename(filename)
    return path if path.exists() else None


def delete_icon(device_id: str) -> None:
    directory = _device_dir(device_id)
    if directory.exists():
        shutil.rmtree(directory)
