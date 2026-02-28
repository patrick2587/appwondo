"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { useToastStore } from "@/components/ui/Toast";
import { setAccessToken, getTokenPayload } from "@/lib/auth";
import { LogIn } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { addToast } = useToastStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Anmeldung fehlgeschlagen" }));
        throw new Error(data.detail || "Anmeldung fehlgeschlagen");
      }

      const data = await res.json();

      // Store tokens
      setAccessToken(data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      // Decode user from token
      const payload = getTokenPayload();
      if (payload) {
        const user: AuthUser = {
          id: payload.sub,
          email: payload.email,
          display_name: payload.display_name,
          role: payload.role as AuthUser["role"],
          avatar_url: null,
        };
        login(user, data.access_token, data.refresh_token);
      }

      addToast("success", "Erfolgreich angemeldet.");
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Anmeldung fehlgeschlagen";
      setError(message);
      addToast("error", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="mb-6 text-center text-xl font-semibold font-heading text-text-primary">
        Anmelden
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="E-Mail"
          type="email"
          name="email"
          placeholder="name@example.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          error={error && !email ? "E-Mail ist erforderlich" : undefined}
        />

        <Input
          label="Passwort"
          type="password"
          name="password"
          placeholder="Passwort eingeben"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          error={error && !password ? "Passwort ist erforderlich" : undefined}
        />

        {error && (
          <p className="text-sm text-secondary-red">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          <LogIn className="h-4 w-4" />
          {isSubmitting ? "Wird angemeldet..." : "Anmelden"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-secondary">
        Noch kein Konto?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Registrieren
        </Link>
      </p>
    </div>
  );
}
