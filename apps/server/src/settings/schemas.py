from typing import Literal

from pydantic import BaseModel, Field

from src.core.schemas import TimestampedRead

HighlightEffect = Literal["solid", "blink", "pulse"]

Channel = Field(ge=0, le=255)


class SettingsRead(TimestampedRead):
    highlight_r: int
    highlight_g: int
    highlight_b: int
    highlight_effect: HighlightEffect


class SettingsUpdate(BaseModel):
    """All fields optional — a PATCH may set any subset."""

    highlight_r: int | None = Field(default=None, ge=0, le=255)
    highlight_g: int | None = Field(default=None, ge=0, le=255)
    highlight_b: int | None = Field(default=None, ge=0, le=255)
    highlight_effect: HighlightEffect | None = None
