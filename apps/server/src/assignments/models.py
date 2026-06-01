from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base
from src.core.models import IDMixin, TimestampMixin

if TYPE_CHECKING:
    from src.cells.models import Cell
    from src.items.models import Item


class Assignment(Base, IDMixin, TimestampMixin):
    __tablename__ = "assignments"

    item_id: Mapped[str] = mapped_column(ForeignKey("items.id", ondelete="CASCADE"))
    # Unique: a cell holds at most one assignment.
    cell_id: Mapped[str] = mapped_column(
        ForeignKey("cells.id", ondelete="CASCADE"), unique=True
    )
    quantity: Mapped[int] = mapped_column(default=0)

    item: Mapped[Item] = relationship(back_populates="assignments")
    cell: Mapped[Cell] = relationship(back_populates="assignment")
