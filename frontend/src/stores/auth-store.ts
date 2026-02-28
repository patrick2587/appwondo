import { create } from "zustand";
import { setAccessToken } from "@/lib/auth";

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "vorstand" | "mitglied" | "gast";
  avatar_url: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user, accessToken, refreshToken) => {
    setAccessToken(accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    setAccessToken(null);
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },
}));
