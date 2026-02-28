"use client";

import { useState } from "react";
import Link from "next/link";
import { useAlbums, useCreateAlbum, type Album } from "@/queries/gallery-queries";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useToastStore } from "@/components/ui/Toast";
import { Plus, Images, ImageIcon } from "lucide-react";

export default function GalleryPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { data: albums, isLoading } = useAlbums();
  const createAlbum = useCreateAlbum();

  const isAdmin = user?.role === "admin" || user?.role === "vorstand";

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumDescription, setNewAlbumDescription] = useState("");

  async function handleCreateAlbum() {
    if (!newAlbumTitle.trim()) return;

    try {
      await createAlbum.mutateAsync({
        title: newAlbumTitle.trim(),
        description: newAlbumDescription.trim() || undefined,
      });
      addToast("success", "Album erfolgreich erstellt.");
      setShowCreateModal(false);
      setNewAlbumTitle("");
      setNewAlbumDescription("");
    } catch {
      addToast("error", "Album konnte nicht erstellt werden.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-text-primary">
            Galerie
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Fotos und Alben des Vereins.
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            Neues Album
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : albums && albums.length > 0 ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {albums.map((album: Album) => (
            <Link
              key={album.id}
              href={`/gallery/${album.id}`}
              className="group overflow-hidden rounded-lg border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="aspect-square bg-light-gray">
                {album.cover_thumbnail ? (
                  <img
                    src={album.cover_thumbnail}
                    alt={album.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Images className="h-12 w-12 text-text-muted" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-text-primary truncate">
                  {album.title}
                </h3>
                <p className="mt-0.5 text-xs text-text-muted">
                  {album.image_count} {album.image_count === 1 ? "Bild" : "Bilder"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ImageIcon}
          title="Noch keine Alben"
          description="Erstelle das erste Album, um Fotos hochzuladen."
          action={
            isAdmin ? (
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4" />
                Neues Album
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Create Album Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Neues Album erstellen"
      >
        <div className="space-y-4">
          <Input
            label="Albumtitel"
            name="album_title"
            placeholder="z.B. Sommerfest 2026"
            value={newAlbumTitle}
            onChange={(e) => setNewAlbumTitle(e.target.value)}
            required
          />
          <Input
            label="Beschreibung (optional)"
            name="album_description"
            placeholder="Kurze Beschreibung..."
            value={newAlbumDescription}
            onChange={(e) => setNewAlbumDescription(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateAlbum}
              disabled={!newAlbumTitle.trim() || createAlbum.isPending}
            >
              {createAlbum.isPending ? "Wird erstellt..." : "Erstellen"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
