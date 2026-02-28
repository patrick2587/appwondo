from icalendar import Calendar, Event as ICalEvent

from app.models.calendar import Event


def generate_ics(events: list[Event]) -> str:
    cal = Calendar()
    cal.add("prodid", "-//Appwondo//Taekwon-Do Torgau//DE")
    cal.add("version", "2.0")
    cal.add("calscale", "GREGORIAN")

    for event in events:
        ical_event = ICalEvent()
        ical_event.add("uid", f"{event.id}@appwondo")
        ical_event.add("summary", event.title)
        ical_event.add("dtstart", event.start_time)
        ical_event.add("dtend", event.end_time)
        if event.description:
            ical_event.add("description", event.description)
        if event.location:
            ical_event.add("location", event.location)
        if event.rrule:
            from dateutil.rrule import rrulestr
            rule = rrulestr(event.rrule, dtstart=event.start_time)
            ical_event.add("rrule", {"FREQ": [event.rrule.split("FREQ=")[1].split(";")[0]] if "FREQ=" in event.rrule else []})
        cal.add_component(ical_event)

    return cal.to_ical().decode("utf-8")
