"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import { Shield, Users, Link2, Copy, Clock } from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  display_name: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

interface Invitation {
  id: string;
  token: string;
  role: string;
  created_by: string;
  expires_at: string;
  used_at: string | null;
}

const ROLES = ["admin", "vorstand", "mitglied", "gast"] as const;

function roleBadgeVariant(role: string) {
  switch (role) {
    case "admin":
      return "default";
    case "vorstand":
      return "default";
    case "mitglied":
      return "secondary";
    default:
      return "outline";
  }
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const isAdmin = user?.role === "admin" || user?.role === "vorstand";

  const [users, setUsers] = useState<UserItem[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);

  // Invitation form
  const [inviteRole, setInviteRole] = useState<string>("mitglied");
  const [inviteExpiry, setInviteExpiry] = useState("72");
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  // Redirect if not authorized
  useEffect(() => {
    if (user && !isAdmin) {
      router.replace("/");
    }
  }, [user, isAdmin, router]);

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await apiClient<UserItem[]>("/api/users/");
        setUsers(data);
      } catch {
        addToast("error", "Benutzer konnten nicht geladen werden.");
      } finally {
        setIsLoadingUsers(false);
      }
    }
    if (isAdmin) fetchUsers();
  }, [isAdmin, addToast]);

  // Fetch invitations
  useEffect(() => {
    async function fetchInvitations() {
      try {
        const data = await apiClient<Invitation[]>("/api/auth/invitations");
        setInvitations(data);
      } catch {
        addToast("error", "Einladungen konnten nicht geladen werden.");
      } finally {
        setIsLoadingInvitations(false);
      }
    }
    if (isAdmin) fetchInvitations();
  }, [isAdmin, addToast]);

  // Change user role
  async function handleRoleChange(userId: string, newRole: string) {
    try {
      const updated = await apiClient<UserItem>(`/api/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u))
      );
      addToast("success", "Rolle erfolgreich geaendert.");
    } catch {
      addToast("error", "Rolle konnte nicht geaendert werden.");
    }
  }

  // Create invitation
  async function handleCreateInvitation() {
    setIsCreatingInvite(true);
    try {
      const data = await apiClient<Invitation>("/api/auth/invitations", {
        method: "POST",
        body: JSON.stringify({
          role: inviteRole,
          expires_hours: parseInt(inviteExpiry, 10),
        }),
      });
      setInvitations((prev) => [data, ...prev]);
      addToast("success", "Einladung erfolgreich erstellt.");
    } catch {
      addToast("error", "Einladung konnte nicht erstellt werden.");
    } finally {
      setIsCreatingInvite(false);
    }
  }

  // Copy invite link
  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/register?invite_token=${token}`;
    navigator.clipboard.writeText(url).then(
      () => addToast("success", "Link in die Zwischenablage kopiert."),
      () => addToast("error", "Link konnte nicht kopiert werden.")
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">
          Administration
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Benutzer- und Einladungsverwaltung.
        </p>
      </div>

      {/* Users Section */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold font-heading">Benutzer</h2>
        </div>

        {isLoadingUsers ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 font-medium text-text-secondary">Name</th>
                  <th className="pb-2 pr-4 font-medium text-text-secondary">E-Mail</th>
                  <th className="pb-2 pr-4 font-medium text-text-secondary">Rolle</th>
                  <th className="pb-2 pr-4 font-medium text-text-secondary">Registriert</th>
                  {user?.role === "admin" && (
                    <th className="pb-2 font-medium text-text-secondary">Aktion</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 pr-4 font-medium text-text-primary">
                      {u.display_name}
                    </td>
                    <td className="py-3 pr-4 text-text-secondary">{u.email}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={roleBadgeVariant(u.role)}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-text-muted">
                      {formatDate(u.created_at)}
                    </td>
                    {user?.role === "admin" && (
                      <td className="py-3">
                        {u.id !== user.id ? (
                          <Select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="w-32"
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <span className="text-xs text-text-muted">
                            Eigene Rolle
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invitations Section */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold font-heading">Einladungen</h2>
        </div>

        {/* Create invitation form */}
        <div className="mb-6 rounded-md border border-border bg-bg-page p-4">
          <h3 className="mb-3 text-sm font-medium text-text-primary">
            Neue Einladung erstellen
          </h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Select
              label="Rolle"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="sm:w-40"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
            <Input
              label="Gueltig (Stunden)"
              type="number"
              name="expires_hours"
              value={inviteExpiry}
              onChange={(e) => setInviteExpiry(e.target.value)}
              min="1"
              max="720"
              className="sm:w-32"
            />
            <Button
              onClick={handleCreateInvitation}
              disabled={isCreatingInvite}
              className="sm:mb-0"
            >
              <Shield className="h-4 w-4" />
              {isCreatingInvite ? "Erstellen..." : "Erstellen"}
            </Button>
          </div>
        </div>

        {/* Existing invitations */}
        {isLoadingInvitations ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : invitations.length > 0 ? (
          <div className="space-y-3">
            {invitations.map((inv) => {
              const isExpired = new Date(inv.expires_at) < new Date();
              const isUsed = !!inv.used_at;

              return (
                <div
                  key={inv.id}
                  className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={roleBadgeVariant(inv.role)}>
                        {inv.role}
                      </Badge>
                      {isUsed ? (
                        <Badge variant="secondary">Eingeloest</Badge>
                      ) : isExpired ? (
                        <Badge variant="outline">Abgelaufen</Badge>
                      ) : (
                        <Badge variant="default">Aktiv</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <Clock className="h-3 w-3" />
                      <span>
                        Gueltig bis: {formatDate(inv.expires_at)}
                      </span>
                    </div>
                  </div>

                  {!isUsed && !isExpired && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInviteLink(inv.token)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Link kopieren
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-text-muted py-4">
            Noch keine Einladungen erstellt.
          </p>
        )}
      </Card>
    </div>
  );
}
