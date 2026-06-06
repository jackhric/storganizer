from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base
from src.core.models import IDMixin, TimestampMixin

if TYPE_CHECKING:
    from src.cells.models import Cell


class Device(Base, IDMixin, TimestampMixin):
    __tablename__ = "devices"

    name: Mapped[str] = mapped_column(unique=True)
    url: Mapped[str] = mapped_column(unique=True)
    icon: Mapped[str] = mapped_column(default="")  # stored filename ("" = none)
    led_count: Mapped[int] = mapped_column(default=0)
    grid_width: Mapped[int] = mapped_column(default=0)
    grid_height: Mapped[int] = mapped_column(default=0)
    is_online: Mapped[bool] = mapped_column(default=False)
    last_seen: Mapped[datetime | None] = mapped_column(default=None)

    # Deleting a device removes its cells (and, transitively, assignments).
    cells: Mapped[list[Cell]] = relationship(
        back_populates="device",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
