"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { useWikiPage } from "@/queries/wiki-queries";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, Pencil, Clock } from "lucide-react";

export default function WikiPageView() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuthStore();

  const { data: page, isLoading, error } = useWikiPage(slug);

  const isAdmin = user?.role === "admin" || user?.role === "vorstand";

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="space-y-4">
        <Link
          href="/wiki"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurueck zum Wiki
        </Link>
        <div className="rounded-lg border border-border bg-white p-8 text-center">
          <p className="text-text-secondary">
            Seite nicht gefunden.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/wiki"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurueck zum Wiki
        </Link>
        {isAdmin && (
          <Link href={`/wiki/${slug}/edit`}>
            <Button size="sm" variant="outline">
              <Pencil className="h-4 w-4" />
              Bearbeiten
            </Button>
          </Link>
        )}
      </div>

      {/* Page content */}
      <article className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-bold font-heading text-text-primary">
          {page.title}
        </h1>

        {/* Last edited info */}
        <div className="mb-6 flex items-center gap-2 text-xs text-text-muted">
          <Clock className="h-3.5 w-3.5" />
          <span>Zuletzt bearbeitet: {formatDateTime(page.updated_at)}</span>
        </div>

        {/* Markdown content */}
        <div className="prose prose-sm max-w-none text-text-primary prose-headings:font-heading prose-headings:text-text-primary prose-a:text-primary prose-code:text-sm prose-pre:bg-dark-charcoal prose-pre:text-white">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
          >
            {page.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
