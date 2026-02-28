import { create } from "zustand";

type ConnectionState = "connected" | "disconnected" | "connecting";

interface ChatState {
  connectionState: ConnectionState;
  typingUsers: Map<string, Set<string>>;
  setConnectionState: (state: ConnectionState) => void;
  setTyping: (channelId: string, userId: string) => void;
  clearTyping: (channelId: string, userId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  connectionState: "disconnected",
  typingUsers: new Map(),

  setConnectionState: (connectionState) => {
    set({ connectionState });
  },

  setTyping: (channelId, userId) => {
    set((state) => {
      const next = new Map(state.typingUsers);
      const users = new Set(next.get(channelId) || []);
      users.add(userId);
      next.set(channelId, users);
      return { typingUsers: next };
    });
  },

  clearTyping: (channelId, userId) => {
    set((state) => {
      const next = new Map(state.typingUsers);
      const users = new Set(next.get(channelId) || []);
      users.delete(userId);
      if (users.size === 0) {
        next.delete(channelId);
      } else {
        next.set(channelId, users);
      }
      return { typingUsers: next };
    });
  },
}));
