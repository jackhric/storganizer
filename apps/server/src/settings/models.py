from __future__ import annotations

from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base
from src.core.models import IDMixin, TimestampMixin

# The settings table holds a single global row. We pin it to a fixed id so the
# service can fetch-or-create it without a separate "which row?" lookup.
SINGLETON_ID = "settings_global"

# Default highlight colour reproduces the original hardcoded orange.
DEFAULT_HIGHLIGHT = (255, 140, 0)
DEFAULT_EFFECT = "solid"


class Settings(Base, IDMixin, TimestampMixin):
    __tablename__ = "settings"

    # Highlight colour sent to the LEDs when an item is selected, as 0–255 sRGB
    # channels (the same shape the WARLS stream uses).
    highlight_r: Mapped[int] = mapped_column(default=DEFAULT_HIGHLIGHT[0])
    highlight_g: Mapped[int] = mapped_column(default=DEFAULT_HIGHLIGHT[1])
    highlight_b: Mapped[int] = mapped_column(default=DEFAULT_HIGHLIGHT[2])

    # How the highlight animates: "solid" | "blink" | "pulse". The animation
    # itself runs frontend-side; this just stores the chosen mode.
    highlight_effect: Mapped[str] = mapped_column(default=DEFAULT_EFFECT)
