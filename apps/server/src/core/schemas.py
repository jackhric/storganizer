"""Shared Pydantic base.

A single base model so every response serialises ORM attributes consistently
(and datetimes the same way). Per best practice we keep request/response
schemas decoupled from the ORM models.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    """Base for response schemas read from SQLAlchemy objects."""

    model_config = ConfigDict(from_attributes=True)


class TimestampedRead(ORMModel):
    id: str
    created_at: datetime
    updated_at: datetime
