from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base
from src.core.models import IDMixin, TimestampMixin

if TYPE_CHECKING:
    from src.assignments.models import Assignment
    from src.devices.models import Device


class Cell(Base, IDMixin, TimestampMixin):
    __tablename__ = "cells"

    device_id: Mapped[str] = mapped_column(
        ForeignKey("devices.id", ondelete="CASCADE")
    )
    led_index: Mapped[int]
    label: Mapped[str] = mapped_column(default="")

    device: Mapped[Device] = relationship(back_populates="cells")

    # At most one assignment per cell (enforced by the unique constraint on
    # Assignment.cell_id). Deleting the cell removes its assignment.
    assignment: Mapped[Assignment | None] = relationship(
        back_populates="cell",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )
