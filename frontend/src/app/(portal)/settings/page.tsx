"use client";

import { useState, type FormEvent } from "react";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { apiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/components/ui/Toast";
import { User, Lock, Save } from "lucide-react";

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { addToast } = useToastStore();

  // Profile form
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSavingProfile(true);
    try {
      const updated = await apiClient<{
        id: string;
        email: string;
        display_name: string;
        role: string;
        avatar_url: string | null;
        created_at: string;
      }>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({ display_name: displayName.trim() }),
      });

      setUser({
        id: updated.id,
        email: updated.email,
        display_name: updated.display_name,
        role: updated.role as AuthUser["role"],
        avatar_url: updated.avatar_url,
      });

      addToast("success", "Profil erfolgreich aktualisiert.");
    } catch {
      addToast("error", "Profil konnte nicht aktualisiert werden.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("Neues Passwort muss mindestens 8 Zeichen haben.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwoerter stimmen nicht ueberein.");
      return;
    }

    setIsSavingPassword(true);
    try {
      await apiClient("/api/users/me/password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      addToast("success", "Passwort erfolgreich geaendert.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Passwort konnte nicht geaendert werden.";
      setPasswordError(message);
      addToast("error", message);
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">
          Einstellungen
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Profil und Sicherheit verwalten.
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold font-heading">Profil</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="E-Mail"
            type="email"
            name="email"
            value={user?.email || ""}
            disabled
          />

          <Input
            label="Anzeigename"
            type="text"
            name="display_name"
            placeholder="Dein Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isSavingProfile}>
              <Save className="h-4 w-4" />
              {isSavingProfile ? "Speichern..." : "Profil speichern"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Password Section */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold font-heading">Passwort aendern</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Aktuelles Passwort"
            type="password"
            name="current_password"
            placeholder="Aktuelles Passwort"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Input
            label="Neues Passwort"
            type="password"
            name="new_password"
            placeholder="Mindestens 8 Zeichen"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />

          <Input
            label="Neues Passwort bestaetigen"
            type="password"
            name="confirm_password"
            placeholder="Passwort wiederholen"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            error={passwordError || undefined}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isSavingPassword}>
              <Lock className="h-4 w-4" />
              {isSavingPassword ? "Aendern..." : "Passwort aendern"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
