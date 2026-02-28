"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  useAlbumImages,
  useUploadImage,
  type GalleryImage,
} from "@/queries/gallery-queries";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToastStore } from "@/components/ui/Toast";
import { ArrowLeft, Upload, X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import Link from "next/link";

export default function AlbumPage() {
  const params = useParams();
  const albumId = params.albumId as string;
  const { addToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: images, isLoading } = useAlbumImages(albumId);
  const uploadImage = useUploadImage();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Lightbox-Navigation per Tastatur
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null || !images) return;

      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : images.length - 1
        );
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev !== null && prev < images.length - 1 ? prev + 1 : 0
        );
      }
    },
    [lightboxIndex, images]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Body-Scroll sperren bei offener Lightbox
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      try {
        await uploadImage.mutateAsync({ albumId, file });
      } catch {
        addToast("error", `Fehler beim Hochladen von "${file.name}".`);
      }
    }

    addToast("success", "Bilder erfolgreich hochgeladen.");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const currentImage =
    lightboxIndex !== null && images ? images[lightboxIndex] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurueck zur Galerie
        </Link>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadImage.isPending}
          >
            <Upload className="h-4 w-4" />
            {uploadImage.isPending ? "Wird hochgeladen..." : "Bilder hochladen"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : images && images.length > 0 ? (
        <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {images.map((image: GalleryImage, index: number) => (
            <div
              key={image.id}
              className="group cursor-pointer overflow-hidden rounded-lg border border-border"
              onClick={() => setLightboxIndex(index)}
            >
              <div className="aspect-square">
                <img
                  src={image.thumbnail_path || image.file_path}
                  alt={image.caption || "Bild"}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ImageIcon}
          title="Noch keine Bilder"
          description="Lade das erste Bild in dieses Album hoch."
          action={
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Bilder hochladen
            </Button>
          }
        />
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && currentImage && images && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          {/* Schliessen-Button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Zurueck-Button */}
          <button
            onClick={() =>
              setLightboxIndex((prev) =>
                prev !== null && prev > 0 ? prev - 1 : images.length - 1
              )
            }
            className="absolute left-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Bild */}
          <img
            src={currentImage.file_path}
            alt={currentImage.caption || "Bild"}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />

          {/* Weiter-Button */}
          <button
            onClick={() =>
              setLightboxIndex((prev) =>
                prev !== null && prev < images.length - 1 ? prev + 1 : 0
              )
            }
            className="absolute right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Zaehler */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
