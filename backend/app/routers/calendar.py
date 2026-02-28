from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models.calendar import Event
from app.models.user import Role, User
from app.schemas.calendar import (
    EventCreate,
    EventRead,
    EventResponseCreate,
    EventResponseRead,
    EventUpdate,
    EventWithOccurrence,
)
from app.services.calendar_service import (
    create_event,
    delete_event,
    get_event,
    get_event_responses,
    get_events_in_range,
    update_event,
    upsert_rsvp,
)
from app.utils.ics import generate_ics

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/events", response_model=list[EventWithOccurrence])
async def get_events(
    start: datetime = Query(..., alias="from"),
    end: datetime = Query(..., alias="to"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_events_in_range(db, start, end)


@router.post("/events", response_model=EventRead)
async def post_event(
    data: EventCreate,
    user: User = Depends(require_role(Role.VORSTAND)),
    db: AsyncSession = Depends(get_db),
):
    return await create_event(db, data, user.id)


@router.get("/events/export.ics")
async def export_ics(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event))
    events = list(result.scalars().all())
    ics_content = generate_ics(events)
    return PlainTextResponse(ics_content, media_type="text/calendar")


@router.get("/events/{event_id}", response_model=EventRead)
async def get_event_detail(
    event_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_event(db, event_id)


@router.put("/events/{event_id}", response_model=EventRead)
async def put_event(
    event_id: str,
    data: EventUpdate,
    user: User = Depends(require_role(Role.VORSTAND)),
    db: AsyncSession = Depends(get_db),
):
    return await update_event(db, event_id, data)


@router.delete("/events/{event_id}")
async def remove_event(
    event_id: str,
    user: User = Depends(require_role(Role.VORSTAND)),
    db: AsyncSession = Depends(get_db),
):
    await delete_event(db, event_id)
    return {"detail": "Termin geloscht"}


@router.post("/events/{event_id}/rsvp", response_model=EventResponseRead)
async def rsvp(
    event_id: str,
    data: EventResponseCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    response = await upsert_rsvp(db, event_id, user.id, data.status)
    return EventResponseRead(
        event_id=response.event_id,
        user_id=response.user_id,
        user_name=user.display_name,
        status=response.status,
    )


@router.get("/events/{event_id}/responses", response_model=list[EventResponseRead])
async def get_responses(
    event_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_event_responses(db, event_id)
