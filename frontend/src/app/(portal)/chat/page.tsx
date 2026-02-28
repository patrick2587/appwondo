"use client";

import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-text-muted" />
        <p className="mt-3 text-sm text-text-secondary">
          Waehle einen Kanal aus, um zu chatten.
        </p>
      </div>
    </div>
  );
}
