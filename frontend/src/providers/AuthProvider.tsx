"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { setAccessToken, getTokenPayload } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/register"];
const REFRESH_INTERVAL_MS = 30 * 1000;
const REFRESH_BUFFER_SECONDS = 2 * 60;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  async function refreshAuth(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) return false;

      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        localStorage.removeItem("refresh_token");
        setAccessToken(null);
        return false;
      }

      const data = await res.json();
      setAccessToken(data.access_token);

      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }

      const payload = getTokenPayload();
      if (payload) {
        const user: AuthUser = {
          id: payload.sub,
          email: payload.email,
          display_name: payload.display_name,
          role: payload.role as AuthUser["role"],
          avatar_url: null,
        };
        setUser(user);
      }

      return true;
    } catch {
      return false;
    }
  }

  // Initial auth check on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const success = await refreshAuth();

      if (cancelled) return;

      if (!success && !isPublicPath) {
        logout();
        router.replace("/login");
      }

      setLoading(false);
    }

    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Proactive token refresh interval
  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const payload = getTokenPayload();
      if (!payload) return;

      const nowSeconds = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - nowSeconds;

      if (timeUntilExpiry <= REFRESH_BUFFER_SECONDS) {
        refreshAuth();
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return <>{children}</>;
}
