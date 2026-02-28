import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ---- Types ----

export type UserRole = "admin" | "vorstand" | "mitglied" | "gast";

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Invitation {
  id: string;
  token: string;
  role: UserRole;
  created_by: string;
  expires_at: string;
  used_at: string | null;
}

interface CreateInvitationPayload {
  role?: UserRole;
  expires_hours?: number;
}

// ---- Query Keys ----

export const adminKeys = {
  all: ["admin"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  invitations: () => [...adminKeys.all, "invitations"] as const,
};

// ---- Queries ----

export function useUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: () => apiClient<User[]>("/api/users/"),
  });
}

export function useInvitations() {
  return useQuery({
    queryKey: adminKeys.invitations(),
    queryFn: () => apiClient<Invitation[]>("/api/auth/invitations"),
  });
}

// ---- Mutations ----

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInvitationPayload = {}) =>
      apiClient<Invitation>("/api/auth/invitations", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.invitations() });
    },
  });
}
