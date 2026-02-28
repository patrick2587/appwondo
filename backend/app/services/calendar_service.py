from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.exceptions import NotFoundError
from app.models.calendar import Event, EventResponse, RSVPStatus
from app.models.user import User
from app.schemas.calendar import EventCreate, EventUpdate, EventResponseRead, EventWithOccurrence
from app.utils.recurrence import expand_recurrence


async def create_event(db: AsyncSession, data: EventCreate, user_id: str) -> Event:
    event = Event(
        title=data.title,
        description=data.description,
        location=data.location,
        start_time=data.start_time,
        end_time=data.end_time,
        rrule=data.rrule,
        created_by=user_id,
    )
    db.add(event)
    await db.flush()
    return event


async def update_event(db: AsyncSession, event_id: str, data: EventUpdate) -> Event:
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise NotFoundError("Termin nicht gefunden")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    await db.flush()
    return event


async def delete_event(db: AsyncSession, event_id: str) -> None:
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise NotFoundError("Termin nicht gefunden")
    await db.delete(event)
    await db.flush()


async def get_events_in_range(
    db: AsyncSession, start: datetime, end: datetime
) -> list[EventWithOccurrence]:
    result = await db.execute(select(Event).order_by(Event.start_time))
    events = list(result.scalars().all())

    occurrences: list[EventWithOccurrence] = []
    for event in events:
        if event.rrule:
            expanded = expand_recurrence(event, start, end)
            occurrences.extend(expanded)
        else:
            if event.start_time <= end and event.end_time >= start:
                occurrences.append(
                    EventWithOccurrence(
                        id=event.id,
                        title=event.title,
                        description=event.description,
                        location=event.location,
                        start_time=event.start_time,
                        end_time=event.end_time,
                    )
                )

    occurrences.sort(key=lambda e: e.start_time)
    return occurrences


async def get_event(db: AsyncSession, event_id: str) -> Event:
    result = await db.execute(
        select(Event).options(joinedload(Event.responses)).where(Event.id == event_id)
    )
    event = result.unique().scalar_one_or_none()
    if not event:
        raise NotFoundError("Termin nicht gefunden")
    return event


async def upsert_rsvp(
    db: AsyncSession, event_id: str, user_id: str, status: RSVPStatus
) -> EventResponse:
    await get_event(db, event_id)
    result = await db.execute(
        select(EventResponse).where(
            EventResponse.event_id == event_id, EventResponse.user_id == user_id
        )
    )
    response = result.scalar_one_or_none()
    if response:
        response.status = status
    else:
        response = EventResponse(event_id=event_id, user_id=user_id, status=status)
        db.add(response)
    await db.flush()
    return response


async def get_event_responses(
    db: AsyncSession, event_id: str
) -> list[EventResponseRead]:
    result = await db.execute(
        select(EventResponse)
        .options(joinedload(EventResponse.user))
        .where(EventResponse.event_id == event_id)
    )
    responses = result.scalars().all()
    return [
        EventResponseRead(
            event_id=r.event_id,
            user_id=r.user_id,
            user_name=r.user.display_name,
            status=r.status,
        )
        for r in responses
    ]
