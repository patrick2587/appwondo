import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ---- Types ----

export interface WikiPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  parent_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WikiPageTreeItem {
  id: string;
  slug: string;
  title: string;
  parent_id: string | null;
  children: WikiPageTreeItem[];
}

export interface WikiRevision {
  id: string;
  page_id: string;
  title: string;
  content: string;
  edited_by: string;
  editor_name: string;
  created_at: string;
}

interface SaveWikiPagePayload {
  slug?: string;
  title: string;
  content: string;
  parent_id?: string | null;
}

// ---- Query Keys ----

export const wikiKeys = {
  all: ["wiki"] as const,
  pages: () => [...wikiKeys.all, "pages"] as const,
  page: (slug: string) => [...wikiKeys.all, "page", slug] as const,
  revisions: (slug: string) => [...wikiKeys.all, "revisions", slug] as const,
};

// ---- Queries ----

export function useWikiPages() {
  return useQuery({
    queryKey: wikiKeys.pages(),
    queryFn: () => apiClient<WikiPageTreeItem[]>("/api/wiki/pages"),
  });
}

export function useWikiPage(slug: string) {
  return useQuery({
    queryKey: wikiKeys.page(slug),
    queryFn: () => apiClient<WikiPage>(`/api/wiki/pages/${slug}`),
    enabled: !!slug,
  });
}

export function useWikiRevisions(slug: string) {
  return useQuery({
    queryKey: wikiKeys.revisions(slug),
    queryFn: () =>
      apiClient<WikiRevision[]>(`/api/wiki/pages/${slug}/revisions`),
    enabled: !!slug,
  });
}

// ---- Mutations ----

export function useSaveWikiPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveWikiPagePayload) => {
      if (payload.slug) {
        // Update existing page
        return apiClient<WikiPage>(`/api/wiki/pages/${payload.slug}`, {
          method: "PUT",
          body: JSON.stringify({
            title: payload.title,
            content: payload.content,
          }),
        });
      }
      // Create new page
      return apiClient<WikiPage>("/api/wiki/pages", {
        method: "POST",
        body: JSON.stringify({
          title: payload.title,
          content: payload.content,
          parent_id: payload.parent_id || null,
        }),
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: wikiKeys.pages() });
      if (variables.slug) {
        queryClient.invalidateQueries({
          queryKey: wikiKeys.page(variables.slug),
        });
        queryClient.invalidateQueries({
          queryKey: wikiKeys.revisions(variables.slug),
        });
      }
    },
  });
}
