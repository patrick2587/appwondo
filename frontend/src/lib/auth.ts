let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  display_name: string;
  type: string;
  exp: number;
  iat: number;
  [key: string]: unknown;
}

/**
 * Decodes the JWT payload without verifying the signature.
 * Returns null if the token is invalid.
 */
export function getTokenPayload(): TokenPayload | null {
  if (!accessToken) return null;

  try {
    const parts = accessToken.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Checks whether the current access token has expired.
 * Returns true if expired or no token is present.
 */
export function isTokenExpired(): boolean {
  const payload = getTokenPayload();
  if (!payload) return true;

  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds;
}
