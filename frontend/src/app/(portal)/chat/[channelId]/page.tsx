"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  useMessages,
  chatKeys,
  type ChatMessage,
  type CursorPage,
} from "@/queries/chat-queries";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/utils";
import { Send, ArrowLeft, Wifi, WifiOff } from "lucide-react";

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.channelId as string;
  const queryClient = useQueryClient();
  const ws = useWebSocket();
  const { user } = useAuthStore();
  const { connectionState, typingUsers, setTyping, clearTyping } = useChatStore();

  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(channelId);

  // Flatten all pages into a single array of messages (oldest first)
  const messages = data?.pages
    ? data.pages.flatMap((page) => page.items).reverse()
    : [];

  // Subscribe to channel on mount
  useEffect(() => {
    if (!ws || !channelId) return;

    ws.send({ action: "subscribe", channel_id: channelId });

    return () => {
      ws.send({ action: "unsubscribe", channel_id: channelId });
    };
  }, [ws, channelId]);

  // Listen for new messages via WebSocket
  useEffect(() => {
    if (!ws) return;

    const unsubNewMessage = ws.on("new_message", (data: any) => {
      if (data.channel_id !== channelId) return;

      const newMessage: ChatMessage = data.payload;

      // Update query cache with the new message
      queryClient.setQueryData(
        chatKeys.messages(channelId),
        (old: { pages: CursorPage<ChatMessage>[]; pageParams: unknown[] } | undefined) => {
          if (!old) return old;

          // Add message to the first page (most recent)
          const updatedPages = [...old.pages];
          if (updatedPages.length > 0) {
            updatedPages[0] = {
              ...updatedPages[0],
              items: [newMessage, ...updatedPages[0].items],
            };
          }

          return { ...old, pages: updatedPages };
        }
      );
    });

    const unsubTyping = ws.on("user_typing", (data: any) => {
      if (data.channel_id !== channelId) return;
      if (data.payload?.user_id === user?.id) return;

      setTyping(channelId, data.payload?.user_name || data.payload?.user_id);

      // Clear typing after 3 seconds
      setTimeout(() => {
        clearTyping(channelId, data.payload?.user_name || data.payload?.user_id);
      }, 3000);
    });

    return () => {
      unsubNewMessage();
      unsubTyping();
    };
  }, [ws, channelId, queryClient, user?.id, setTyping, clearTyping]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, shouldAutoScroll]);

  // Detect if user has scrolled up
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  }, []);

  // Send message
  function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    const content = messageInput.trim();
    if (!content || !ws) return;

    ws.send({
      action: "send_message",
      channel_id: channelId,
      payload: { content },
    });

    setMessageInput("");
  }

  // Send typing indicator
  function handleTyping() {
    if (!ws) return;
    ws.send({ action: "typing", channel_id: channelId });
  }

  // Typing indicator display
  const channelTyping = typingUsers.get(channelId);
  const typingNames = channelTyping ? Array.from(channelTyping) : [];

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex h-12 items-center gap-3 border-b border-border px-4">
        <Link
          href="/chat"
          className="text-text-secondary hover:text-text-primary md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="flex items-center gap-2">
          {connectionState === "connected" ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-text-muted" />
          )}
          <span className="text-sm font-medium text-text-primary">
            Kanal
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Load older messages */}
        {hasNextPage && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Laden..." : "Aeltere Nachrichten laden"}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-text-muted">
              Noch keine Nachrichten. Schreib die erste!
            </p>
          </div>
        ) : (
          messages.map((msg: ChatMessage) => {
            const isOwn = msg.sender_id === user?.id;

            return (
              <div key={msg.id} className="flex items-start gap-3">
                <Avatar name={msg.sender_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-sm font-medium ${
                        isOwn ? "text-primary" : "text-text-primary"
                      }`}
                    >
                      {msg.sender_name}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatDateTime(msg.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-text-primary whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingNames.length > 0 && (
        <div className="px-4 py-1">
          <p className="text-xs text-text-muted italic">
            {typingNames.length === 1
              ? `${typingNames[0]} tippt...`
              : `${typingNames.join(", ")} tippen...`}
          </p>
        </div>
      )}

      {/* Message input */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              handleTyping();
            }}
            placeholder="Nachricht schreiben..."
            className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!messageInput.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
