"use client";

import { useState, useMemo } from "react";
import { useEvents, type CalendarEvent } from "@/queries/calendar-queries";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatTime, cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { de } from "date-fns/locale";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: events, isLoading } = useEvents(
    monthStart.toISOString(),
    monthEnd.toISOString()
  );

  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  function getEventsForDay(day: Date): CalendarEvent[] {
    if (!events) return [];
    return events.filter((event) => {
      const eventDate = new Date(event.start_time);
      return isSameDay(eventDate, day);
    });
  }

  function handlePrevMonth() {
    setCurrentDate((prev) => subMonths(prev, 1));
  }

  function handleNextMonth() {
    setCurrentDate((prev) => addMonths(prev, 1));
  }

  // Agenda-Ansicht fuer Mobile: gefilterte & sortierte Events
  const sortedEvents = useMemo(() => {
    if (!events) return [];
    return [...events].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  }, [events]);

  return (
    <div className="space-y-4">
      {/* Kopfzeile mit Navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading text-text-primary">
          Kalender
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center text-sm font-semibold">
            {format(currentDate, "MMMM yyyy", { locale: de })}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Desktop: Monatsgitter */}
          <Card className="hidden md:block overflow-hidden p-0">
            <div className="grid grid-cols-7">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="border-b border-border px-2 py-2 text-center text-xs font-semibold text-text-secondary"
                >
                  {day}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const inMonth = isSameMonth(day, currentDate);
                const today = isToday(day);

                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[100px] border-b border-r border-border p-1",
                      !inMonth && "bg-light-gray/50"
                    )}
                  >
                    <div
                      className={cn(
                        "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs",
                        today && "bg-primary text-white font-bold",
                        !inMonth && "text-text-muted"
                      )}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <Link
                          key={event.id}
                          href={`/calendar/${event.id}`}
                          className="block truncate rounded bg-primary/10 px-1 py-0.5 text-xs text-primary hover:bg-primary/20"
                        >
                          {formatTime(event.start_time)} {event.title}
                        </Link>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="block text-xs text-text-muted px-1">
                          +{dayEvents.length - 3} weitere
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Mobile: Agenda-Liste */}
          <div className="space-y-2 md:hidden">
            {sortedEvents.length > 0 ? (
              sortedEvents.map((event) => (
                <Link key={event.id} href={`/calendar/${event.id}`}>
                  <Card className="flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-primary/10">
                      <span className="text-xs font-medium text-primary">
                        {format(new Date(event.start_time), "dd", { locale: de })}
                      </span>
                      <span className="text-xs text-primary">
                        {format(new Date(event.start_time), "MMM", { locale: de })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text-primary truncate">
                        {event.title}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {formatTime(event.start_time)}
                        {event.location && ` - ${event.location}`}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="Keine Termine"
                description="In diesem Monat sind keine Termine vorhanden."
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
