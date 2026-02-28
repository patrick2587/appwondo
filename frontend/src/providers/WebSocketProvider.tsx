"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { WSClient } from "@/lib/ws-client";
import { getAccessToken } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";

const WebSocketContext = createContext<WSClient | null>(null);

export function useWebSocket() {
  return useContext(WebSocketContext);
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const { setConnectionState } = useChatStore();
  const clientRef = useRef<WSClient | null>(null);
  const [client, setClient] = useState<WSClient | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      clientRef.current?.disconnect();
      clientRef.current = null;
      setClient(null);
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:8000/ws/chat`;
    const wsClient = new WSClient(wsUrl, token);

    wsClient.on("connectionChange", (data: any) => {
      setConnectionState(data.connected ? "connected" : "disconnected");
    });

    wsClient.connect();
    clientRef.current = wsClient;
    setClient(wsClient);

    return () => {
      wsClient.disconnect();
    };
  }, [isAuthenticated, setConnectionState]);

  return (
    <WebSocketContext.Provider value={client}>
      {children}
    </WebSocketContext.Provider>
  );
}
