"use client";

import { useParams } from "next/navigation";
import { useEvent, useEventResponses, useRsvp } from "@/queries/calendar-queries";
import { useAuthStore } from "@/stores/auth-store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/utils";
import { useToastStore } from "@/components/ui/Toast";
import { ArrowLeft, MapPin, Clock, Users } from "lucide-react";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  yes: "Zugesagt",
  no: "Abgesagt",
  maybe: "Vielleicht",
};

const statusVariants: Record<string, "success" | "error" | "warning"> = {
  yes: "success",
  no: "error",
  maybe: "warning",
};

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: responses, isLoading: responsesLoading } = useEventResponses(eventId);
  const rsvpMutation = useRsvp();

  async function handleRsvp(status: "yes" | "no" | "maybe") {
    try {
      await rsvpMutation.mutateAsync({ eventId, status });
      addToast("success", `Antwort "${statusLabels[status]}" gespeichert.`);
    } catch {
      addToast("error", "Fehler beim Speichern der Antwort.");
    }
  }

  if (eventLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-4">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurueck zum Kalender
        </Link>
        <p className="text-text-secondary">Termin nicht gefunden.</p>
      </div>
    );
  }

  const myResponse = responses?.find((r) => r.user_id === user?.id);

  const accepted = responses?.filter((r) => r.status === "yes") ?? [];
  const declined = responses?.filter((r) => r.status === "no") ?? [];
  const tentative = responses?.filter((r) => r.status === "maybe") ?? [];

  return (
    <div className="space-y-6">
      <Link
        href="/calendar"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurueck zum Kalender
      </Link>

      <Card>
        <h1 className="text-xl font-bold font-heading text-text-primary">
          {event.title}
        </h1>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              {formatDateTime(event.start_time)} - {formatDateTime(event.end_time)}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="whitespace-pre-wrap text-sm text-text-primary">
              {event.description}
            </p>
          </div>
        )}

        {/* RSVP-Aktionen */}
        <div className="mt-6 border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">
            Teilnahme
          </h3>
          {myResponse && (
            <p className="mb-3 text-sm text-text-secondary">
              Deine aktuelle Antwort:{" "}
              <Badge variant={statusVariants[myResponse.status]}>
                {statusLabels[myResponse.status]}
              </Badge>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={myResponse?.status === "yes" ? "default" : "outline"}
              size="sm"
              onClick={() => handleRsvp("yes")}
              disabled={rsvpMutation.isPending}
            >
              Ja
            </Button>
            <Button
              variant={myResponse?.status === "no" ? "destructive" : "outline"}
              size="sm"
              onClick={() => handleRsvp("no")}
              disabled={rsvpMutation.isPending}
            >
              Nein
            </Button>
            <Button
              variant={myResponse?.status === "maybe" ? "secondary" : "outline"}
              size="sm"
              onClick={() => handleRsvp("maybe")}
              disabled={rsvpMutation.isPending}
            >
              Vielleicht
            </Button>
          </div>
        </div>
      </Card>

      {/* Teilnehmerliste */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold font-heading">Teilnehmer</h2>
        </div>

        {responsesLoading ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            {accepted.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-text-secondary">
                  Zugesagt ({accepted.length})
                </h4>
                <div className="space-y-1">
                  {accepted.map((r) => (
                    <div key={r.user_id} className="flex items-center gap-2 py-1">
                      <Avatar name={r.user_name} size="sm" />
                      <span className="text-sm">{r.user_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tentative.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-text-secondary">
                  Vielleicht ({tentative.length})
                </h4>
                <div className="space-y-1">
                  {tentative.map((r) => (
                    <div key={r.user_id} className="flex items-center gap-2 py-1">
                      <Avatar name={r.user_name} size="sm" />
                      <span className="text-sm">{r.user_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {declined.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-text-secondary">
                  Abgesagt ({declined.length})
                </h4>
                <div className="space-y-1">
                  {declined.map((r) => (
                    <div key={r.user_id} className="flex items-center gap-2 py-1">
                      <Avatar name={r.user_name} size="sm" />
                      <span className="text-sm text-text-muted">{r.user_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {accepted.length === 0 &&
              tentative.length === 0 &&
              declined.length === 0 && (
                <p className="text-sm text-text-muted">
                  Noch keine Antworten vorhanden.
                </p>
              )}
          </div>
        )}
      </Card>
    </div>
  );
}
