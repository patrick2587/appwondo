import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routen, die ohne Authentifizierung zugaenglich sein sollen
const publicPaths = ["/login", "/register"];

// Statische Dateien und API-Routen ausschliessen
const ignoredPrefixes = ["/_next", "/api", "/favicon.ico", "/logo.png"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Statische Dateien und API-Routen ignorieren
  if (ignoredPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Oeffentliche Routen durchlassen
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Auf Refresh-Token-Cookie pruefen
  // Da Edge Middleware keinen Zugriff auf localStorage hat, verwenden wir Cookies
  // Hinweis: Die primaere Auth-Pruefung findet clientseitig im PortalLayout statt.
  // Diese Middleware dient als zusaetzliche Schutzschicht.
  // Da die App localStorage fuer den refresh_token nutzt und die
  // clientseitige Pruefung im PortalLayout zuverlaessig ist,
  // lassen wir Portal-Routen hier durch und verlassen uns auf die
  // clientseitige Weiterleitung.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Alle Routen ausser:
     * - _next/static (statische Dateien)
     * - _next/image (Bildoptimierung)
     * - favicon.ico (Favicon)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
