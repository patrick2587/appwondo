import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ---- Types ----

export interface Album {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  created_by: string;
  created_at: string;
  image_count: number;
  cover_thumbnail: string | null;
}

export interface GalleryImage {
  id: string;
  album_id: string;
  file_path: string;
  thumbnail_path: string;
  uploaded_by: string;
  caption: string | null;
  created_at: string;
}

interface CreateAlbumPayload {
  title: string;
  description?: string;
}

interface UploadImagePayload {
  albumId: string;
  file: File;
}

interface DeleteImagePayload {
  albumId: string;
  imageId: string;
}

// ---- Query Keys ----

export const galleryKeys = {
  all: ["gallery"] as const,
  albums: () => [...galleryKeys.all, "albums"] as const,
  albumImages: (albumId: string) => [...galleryKeys.all, "images", albumId] as const,
};

// ---- Queries ----

export function useAlbums() {
  return useQuery({
    queryKey: galleryKeys.albums(),
    queryFn: () => apiClient<Album[]>("/api/gallery/albums"),
  });
}

export function useAlbumImages(albumId: string) {
  return useQuery({
    queryKey: galleryKeys.albumImages(albumId),
    queryFn: () =>
      apiClient<GalleryImage[]>(`/api/gallery/albums/${albumId}/images`),
    enabled: !!albumId,
  });
}

// ---- Mutations ----

export function useCreateAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAlbumPayload) =>
      apiClient<Album>("/api/gallery/albums", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKeys.albums() });
    },
  });
}

export function useUploadImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ albumId, file }: UploadImagePayload) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient<GalleryImage>(
        `/api/gallery/albums/${albumId}/images`,
        {
          method: "POST",
          body: formData,
        }
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: galleryKeys.albumImages(variables.albumId),
      });
      queryClient.invalidateQueries({ queryKey: galleryKeys.albums() });
    },
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ albumId, imageId }: DeleteImagePayload) =>
      apiClient<void>(`/api/gallery/images/${imageId}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: galleryKeys.albumImages(variables.albumId),
      });
      queryClient.invalidateQueries({ queryKey: galleryKeys.albums() });
    },
  });
}
