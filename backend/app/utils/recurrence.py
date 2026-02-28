from datetime import datetime, timedelta

from dateutil.rrule import rrulestr

from app.schemas.calendar import EventWithOccurrence


def expand_recurrence(event, range_start: datetime, range_end: datetime) -> list[EventWithOccurrence]:
    if not event.rrule:
        return []

    duration = event.end_time - event.start_time

    try:
        rule = rrulestr(event.rrule, dtstart=event.start_time)
    except Exception:
        return []

    occurrences = []
    for dt in rule.between(range_start - duration, range_end, inc=True):
        occ_start = dt
        occ_end = dt + duration
        if occ_start <= range_end and occ_end >= range_start:
            occurrences.append(
                EventWithOccurrence(
                    id=event.id,
                    title=event.title,
                    description=event.description,
                    location=event.location,
                    start_time=occ_start,
                    end_time=occ_end,
                    is_recurring=True,
                    original_event_id=event.id,
                )
            )
    return occurrences
