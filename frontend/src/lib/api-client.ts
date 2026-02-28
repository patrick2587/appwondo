import { getAccessToken, setAccessToken, isTokenExpired } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) return null;

      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        localStorage.removeItem("refresh_token");
        setAccessToken(null);
        return null;
      }

      const data = await res.json();
      setAccessToken(data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      return data.access_token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiClient<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = getAccessToken();

  if (token && isTokenExpired()) {
    token = await refreshAccessToken();
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      const retryRes = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });
      if (!retryRes.ok) {
        const error = await retryRes.json().catch(() => ({ detail: "Fehler" }));
        throw new Error(error.detail || `HTTP ${retryRes.status}`);
      }
      return retryRes.json();
    }
    window.location.href = "/login";
    throw new Error("Sitzung abgelaufen");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Fehler" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
