from datetime import datetime

from pydantic import BaseModel

from app.models.calendar import RSVPStatus


class EventCreate(BaseModel):
    title: str
    description: str | None = None
    location: str | None = None
    start_time: datetime
    end_time: datetime
    rrule: str | None = None


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    rrule: str | None = None


class EventRead(BaseModel):
    id: str
    title: str
    description: str | None
    location: str | None
    start_time: datetime
    end_time: datetime
    rrule: str | None
    created_by: str
    created_at: datetime

    model_config = {"from_attributes": True}


class EventWithOccurrence(BaseModel):
    id: str
    title: str
    description: str | None
    location: str | None
    start_time: datetime
    end_time: datetime
    is_recurring: bool = False
    original_event_id: str | None = None


class EventResponseCreate(BaseModel):
    status: RSVPStatus


class EventResponseRead(BaseModel):
    event_id: str
    user_id: str
    user_name: str
    status: RSVPStatus

    model_config = {"from_attributes": True}
