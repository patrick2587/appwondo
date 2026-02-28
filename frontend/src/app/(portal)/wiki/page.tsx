"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useWikiPages, type WikiPageTreeItem } from "@/queries/wiki-queries";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookOpen, ChevronRight, ChevronDown, Search, FileText } from "lucide-react";

function filterTree(
  items: WikiPageTreeItem[],
  query: string
): WikiPageTreeItem[] {
  if (!query) return items;

  const lower = query.toLowerCase();

  return items.reduce<WikiPageTreeItem[]>((acc, item) => {
    const matchesTitle = item.title.toLowerCase().includes(lower);
    const filteredChildren = filterTree(item.children, query);

    if (matchesTitle || filteredChildren.length > 0) {
      acc.push({
        ...item,
        children: filteredChildren,
      });
    }

    return acc;
  }, []);
}

function TreeNode({
  item,
  defaultOpen,
}: {
  item: WikiPageTreeItem;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = item.children.length > 0;

  return (
    <div>
      <div className="flex items-center gap-1">
        {hasChildren ? (
          <button
            onClick={() => setOpen(!open)}
            className="rounded p-0.5 text-text-muted transition-colors hover:bg-light-gray hover:text-text-primary"
            aria-label={open ? "Zuklappen" : "Aufklappen"}
          >
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        <Link
          href={`/wiki/${item.slug}`}
          className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-light-gray"
        >
          <FileText className="h-4 w-4 shrink-0 text-text-muted" />
          <span className="text-text-primary">{item.title}</span>
        </Link>
      </div>

      {hasChildren && open && (
        <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border pl-2">
          {item.children.map((child) => (
            <TreeNode key={child.id} item={child} defaultOpen={defaultOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function WikiPage() {
  const { data: pages, isLoading } = useWikiPages();
  const [search, setSearch] = useState("");

  const filteredPages = useMemo(() => {
    if (!pages) return [];
    return filterTree(pages, search);
  }, [pages, search]);

  // When searching, expand all nodes by default
  const defaultOpen = search.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">
          Wiki
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Vereinswissen und Dokumentation.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Seiten durchsuchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : filteredPages.length > 0 ? (
        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <div className="space-y-0.5">
            {filteredPages.map((item) => (
              <TreeNode
                key={item.id}
                item={item}
                defaultOpen={defaultOpen}
              />
            ))}
          </div>
        </div>
      ) : search ? (
        <EmptyState
          icon={Search}
          title="Keine Ergebnisse"
          description={`Keine Seiten gefunden fuer "${search}".`}
        />
      ) : (
        <EmptyState
          icon={BookOpen}
          title="Noch keine Wiki-Seiten"
          description="Es wurden noch keine Seiten erstellt."
        />
      )}
    </div>
  );
}
