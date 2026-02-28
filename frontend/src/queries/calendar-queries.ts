import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ---- Types ----

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  is_recurring?: boolean;
  original_event_id?: string;
  rrule?: string;
  created_by?: string;
  created_at?: string;
}

export interface EventResponse {
  event_id: string;
  user_id: string;
  user_name: string;
  status: "yes" | "no" | "maybe";
}

interface CreateEventPayload {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  rrule?: string;
}

interface RsvpPayload {
  eventId: string;
  status: "yes" | "no" | "maybe";
}

// ---- Query Keys ----

export const calendarKeys = {
  all: ["calendar"] as const,
  events: (from?: string, to?: string) => [...calendarKeys.all, "events", { from, to }] as const,
  event: (eventId: string) => [...calendarKeys.all, "event", eventId] as const,
  responses: (eventId: string) => [...calendarKeys.all, "responses", eventId] as const,
};

// ---- Queries ----

export function useEvents(from?: string, to?: string) {
  return useQuery({
    queryKey: calendarKeys.events(from, to),
    queryFn: () => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const query = params.toString();
      return apiClient<CalendarEvent[]>(
        `/api/calendar/events${query ? `?${query}` : ""}`
      );
    },
  });
}

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: calendarKeys.event(eventId),
    queryFn: () => apiClient<CalendarEvent>(`/api/calendar/events/${eventId}`),
    enabled: !!eventId,
  });
}

export function useEventResponses(eventId: string) {
  return useQuery({
    queryKey: calendarKeys.responses(eventId),
    queryFn: () =>
      apiClient<EventResponse[]>(`/api/calendar/events/${eventId}/responses`),
    enabled: !!eventId,
  });
}

// ---- Mutations ----

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEventPayload) =>
      apiClient<CalendarEvent>("/api/calendar/events", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

export function useRsvp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, status }: RsvpPayload) =>
      apiClient<EventResponse>(`/api/calendar/events/${eventId}/rsvp`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: calendarKeys.responses(variables.eventId),
      });
      queryClient.invalidateQueries({
        queryKey: calendarKeys.event(variables.eventId),
      });
    },
  });
}
