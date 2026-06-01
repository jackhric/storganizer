from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base
from src.core.models import IDMixin, TimestampMixin


class Tag(Base, IDMixin, TimestampMixin):
    __tablename__ = "tags"

    name: Mapped[str] = mapped_column(unique=True)
    color: Mapped[str] = mapped_column(default="")
