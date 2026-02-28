import enum

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import DateTime

from datetime import datetime

from app.models.base import Base, TimestampMixin, generate_uuid


class RSVPStatus(str, enum.Enum):
    YES = "yes"
    NO = "no"
    MAYBE = "maybe"


class Event(Base, TimestampMixin):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, default=None)
    location: Mapped[str | None] = mapped_column(String(300), default=None)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    rrule: Mapped[str | None] = mapped_column(String(500), default=None)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)

    responses: Mapped[list["EventResponse"]] = relationship(back_populates="event")
    creator: Mapped["User"] = relationship()  # noqa: F821


class EventResponse(Base, TimestampMixin):
    __tablename__ = "event_responses"

    event_id: Mapped[str] = mapped_column(ForeignKey("events.id"), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    status: Mapped[RSVPStatus] = mapped_column(Enum(RSVPStatus), nullable=False)

    event: Mapped[Event] = relationship(back_populates="responses")
    user: Mapped["User"] = relationship()  # noqa: F821
