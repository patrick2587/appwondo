"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useEvents } from "@/queries/calendar-queries";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/utils";
import { CalendarDays, MessageCircle, BookOpen } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { from, to } = useMemo(() => {
    const now = new Date();
    const inSevenDays = new Date(now);
    inSevenDays.setDate(inSevenDays.getDate() + 7);
    return { from: now.toISOString(), to: inSevenDays.toISOString() };
  }, []);

  const { data: events, isLoading: eventsLoading } = useEvents(from, to);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-10 w-10 rounded-full hidden sm:block" />
          <div>
            <h1 className="text-2xl font-bold font-heading text-text-primary">
              Willkommen, {user?.display_name || "Mitglied"}!
            </h1>
            <p className="mt-0.5 text-sm text-text-secondary">
              TKD Black Belt Center Torgau
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Kommende Termine */}
        <Card className="md:col-span-2 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold font-heading">
              Kommende Termine
            </h2>
          </div>
          {eventsLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : events && events.length > 0 ? (
            <ul className="space-y-3">
              {events.slice(0, 5).map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/calendar/${event.id}`}
                    className="block rounded-md border border-border p-3 transition-colors hover:bg-light-gray"
                  >
                    <p className="font-medium text-text-primary">
                      {event.title}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {formatDateTime(event.start_time)}
                      {event.location && ` - ${event.location}`}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm text-text-muted">
              Keine Termine in den naechsten 7 Tagen.
            </p>
          )}
          <div className="mt-3">
            <Link
              href="/calendar"
              className="text-sm text-primary hover:underline"
            >
              Alle Termine anzeigen
            </Link>
          </div>
        </Card>

        {/* Schnellzugriff */}
        <div className="space-y-4">
          <Card>
            <Link href="/chat" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Chat</p>
                <p className="text-sm text-text-secondary">
                  Nachrichten lesen
                </p>
              </div>
            </Link>
          </Card>

          <Card>
            <Link href="/wiki" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Wiki</p>
                <p className="text-sm text-text-secondary">
                  Letzte Aenderungen
                </p>
              </div>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
