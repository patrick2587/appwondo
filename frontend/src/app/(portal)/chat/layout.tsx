"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useChannels, type ChatChannel } from "@/queries/chat-queries";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { Hash, Lock, MessageCircle } from "lucide-react";

function ChannelIcon({ type }: { type: ChatChannel["type"] }) {
  if (type === "direct") return <MessageCircle className="h-4 w-4 shrink-0" />;
  if (type === "group") return <Lock className="h-4 w-4 shrink-0" />;
  return <Hash className="h-4 w-4 shrink-0" />;
}

function ChannelSidebar() {
  const pathname = usePathname();
  const { data: channels, isLoading } = useChannels();

  return (
    <div className="flex h-full flex-col border-r border-border bg-white">
      <div className="flex h-12 items-center border-b border-border px-4">
        <h2 className="text-sm font-semibold font-heading text-text-primary">
          Kanaele
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : channels && channels.length > 0 ? (
          <nav className="space-y-0.5">
            {channels.map((channel) => {
              const isActive = pathname === `/chat/${channel.id}`;
              return (
                <Link
                  key={channel.id}
                  href={`/chat/${channel.id}`}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-text-secondary hover:bg-light-gray hover:text-text-primary"
                  )}
                >
                  <ChannelIcon type={channel.type} />
                  <span className="truncate">{channel.name}</span>
                </Link>
              );
            })}
          </nav>
        ) : (
          <p className="px-3 py-4 text-center text-sm text-text-muted">
            Keine Kanaele vorhanden.
          </p>
        )}
      </div>
    </div>
  );
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // On mobile: if we're at /chat (no channel selected), show channel list full width.
  // If we're at /chat/[channelId], show content full width.
  const isChannelSelected = pathname !== "/chat";

  return (
    <div className="-m-4 md:-m-6 flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Channel sidebar: always visible on desktop, hidden on mobile when channel is selected */}
      <div
        className={cn(
          "w-full md:w-64 md:shrink-0 md:block",
          isChannelSelected ? "hidden" : "block"
        )}
      >
        <ChannelSidebar />
      </div>

      {/* Content area: always visible on desktop, hidden on mobile when no channel is selected */}
      <div
        className={cn(
          "flex-1 overflow-hidden",
          isChannelSelected ? "block" : "hidden md:block"
        )}
      >
        {children}
      </div>
    </div>
  );
}
