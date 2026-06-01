"""Reusable ORM mixins.

`IDMixin` gives every table a PocketBase-shaped string primary key.
`TimestampMixin` adds `created_at` / `updated_at` maintained by the ORM.
"""

from datetime import UTC, datetime

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from src.core.ids import generate_id


def _utcnow() -> datetime:
    return datetime.now(UTC)


class IDMixin:
    id: Mapped[str] = mapped_column(String(15), primary_key=True, default=generate_id)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=_utcnow, onupdate=_utcnow)
