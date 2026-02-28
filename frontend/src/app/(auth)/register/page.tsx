"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { useToastStore } from "@/components/ui/Toast";
import { setAccessToken, getTokenPayload } from "@/lib/auth";
import { UserPlus } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const { addToast } = useToastStore();

  const inviteToken = searchParams.get("invite_token") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const body: Record<string, string> = {
        email,
        password,
        display_name: displayName,
      };
      if (inviteToken) {
        body.invite_token = inviteToken;
      }

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Registrierung fehlgeschlagen" }));
        throw new Error(data.detail || "Registrierung fehlgeschlagen");
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

      addToast("success", "Registrierung erfolgreich.");
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registrierung fehlgeschlagen";
      setError(message);
      addToast("error", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="mb-6 text-center text-xl font-semibold font-heading text-text-primary">
        Registrieren
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Anzeigename"
          type="text"
          name="display_name"
          placeholder="Max Mustermann"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          autoComplete="name"
        />

        <Input
          label="E-Mail"
          type="email"
          name="email"
          placeholder="name@example.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Input
          label="Passwort"
          type="password"
          name="password"
          placeholder="Sicheres Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
        />

        {inviteToken && (
          <Input
            label="Einladungscode"
            type="text"
            name="invite_token"
            value={inviteToken}
            disabled
          />
        )}

        {error && (
          <p className="text-sm text-secondary-red">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          <UserPlus className="h-4 w-4" />
          {isSubmitting ? "Wird registriert..." : "Registrieren"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-secondary">
        Bereits ein Konto?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Anmelden
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
