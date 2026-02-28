"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { useWikiPage, useSaveWikiPage } from "@/queries/wiki-queries";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToastStore } from "@/components/ui/Toast";
import { ArrowLeft, Save, Eye, Edit } from "lucide-react";

export default function WikiEditPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { addToast } = useToastStore();

  const { data: page, isLoading } = useWikiPage(slug);
  const saveWikiPage = useSaveWikiPage();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  // Populate fields when page data loads
  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setContent(page.content);
    }
  }, [page]);

  async function handleSave() {
    if (!title.trim()) {
      addToast("error", "Titel darf nicht leer sein.");
      return;
    }

    try {
      await saveWikiPage.mutateAsync({
        slug,
        title: title.trim(),
        content,
      });
      addToast("success", "Seite erfolgreich gespeichert.");
      router.push(`/wiki/${slug}`);
    } catch {
      addToast("error", "Seite konnte nicht gespeichert werden.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col -m-4 md:-m-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/wiki/${slug}`}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Abbrechen
          </Link>
          <span className="text-sm text-text-muted hidden sm:inline">
            Seite bearbeiten
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile tab switcher */}
          <div className="flex rounded-md border border-border md:hidden">
            <button
              onClick={() => setMobileTab("editor")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                mobileTab === "editor"
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:bg-light-gray"
              } rounded-l-md`}
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setMobileTab("preview")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                mobileTab === "preview"
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:bg-light-gray"
              } rounded-r-md`}
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveWikiPage.isPending}
          >
            <Save className="h-4 w-4" />
            {saveWikiPage.isPending ? "Speichern..." : "Speichern"}
          </Button>
        </div>
      </div>

      {/* Title input */}
      <div className="border-b border-border bg-white px-4 py-3">
        <Input
          name="wiki_title"
          placeholder="Seitentitel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold"
        />
      </div>

      {/* Editor + Preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div
          className={`flex-1 ${
            mobileTab === "editor" ? "block" : "hidden"
          } md:block`}
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Inhalt in Markdown schreiben..."
            className="h-full w-full resize-none border-none bg-white p-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none font-mono"
          />
        </div>

        {/* Divider (desktop only) */}
        <div className="hidden w-px bg-border md:block" />

        {/* Preview */}
        <div
          className={`flex-1 overflow-y-auto bg-white p-4 ${
            mobileTab === "preview" ? "block" : "hidden"
          } md:block`}
        >
          <div className="mx-auto max-w-none">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">
              Vorschau
            </p>
            <div className="prose prose-sm max-w-none text-text-primary prose-headings:font-heading prose-headings:text-text-primary prose-a:text-primary prose-code:text-sm prose-pre:bg-dark-charcoal prose-pre:text-white">
              {content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                <p className="text-text-muted italic">
                  Noch kein Inhalt. Beginne links mit dem Schreiben.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
