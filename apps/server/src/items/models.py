from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Column, ForeignKey, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base
from src.core.models import IDMixin, TimestampMixin
from src.tags.models import Tag

if TYPE_CHECKING:
    from src.assignments.models import Assignment

# Many-to-many join between items and tags. Deleting either side removes the
# link rows but never the other record.
item_tags = Table(
    "item_tags",
    Base.metadata,
    Column("item_id", ForeignKey("items.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Item(Base, IDMixin, TimestampMixin):
    __tablename__ = "items"

    name: Mapped[str]
    image: Mapped[str] = mapped_column(default="")  # stored filename ("" = none)
    store_url: Mapped[str] = mapped_column(default="")
    notes: Mapped[str] = mapped_column(default="")
    external_links: Mapped[Any | None] = mapped_column(JSON, default=None)

    tags: Mapped[list[Tag]] = relationship(secondary=item_tags, lazy="selectin")

    assignments: Mapped[list[Assignment]] = relationship(
        back_populates="item",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
