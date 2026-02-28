import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ---- Types ----

export type ChannelType = "public" | "group" | "direct";

export interface ChatChannel {
  id: string;
  name: string;
  type: ChannelType;
  created_by: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  content: string;
  parent_id: string | null;
  edited_at: string | null;
  created_at: string;
}

export interface CursorPage<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
}

// ---- Query Keys ----

export const chatKeys = {
  all: ["chat"] as const,
  channels: () => [...chatKeys.all, "channels"] as const,
  messages: (channelId: string) =>
    [...chatKeys.all, "messages", channelId] as const,
};

// ---- Queries ----

export function useChannels() {
  return useQuery({
    queryKey: chatKeys.channels(),
    queryFn: () => apiClient<ChatChannel[]>("/api/chat/channels"),
  });
}

export function useMessages(channelId: string) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(channelId),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set("cursor", pageParam);
      params.set("limit", "50");
      const query = params.toString();
      return apiClient<CursorPage<ChatMessage>>(
        `/api/chat/channels/${channelId}/messages?${query}`
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: !!channelId,
  });
}

// ---- Mutations ----

/**
 * Send a message via WebSocket.
 * This mutation does not call an HTTP endpoint; it sends through the WS client.
 * The caller should provide the ws send function as context or use useWebSocket.
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelId,
      content,
      parentId,
      sendWs,
    }: {
      channelId: string;
      content: string;
      parentId?: string;
      sendWs: (data: unknown) => void;
    }) => {
      sendWs({
        action: "send_message",
        channel_id: channelId,
        payload: {
          content,
          parent_id: parentId || null,
        },
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(variables.channelId),
      });
    },
  });
}
