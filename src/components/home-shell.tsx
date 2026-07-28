"use client";

import { useState } from "react";
import { ArticleGrid } from "@/components/article-grid";
import { ViewToggle, type FeedView } from "@/components/view-toggle";
import { formatDateTime } from "@/lib/format-date";
import type { Article, Feed } from "@/lib/types";
import { VIEW_COOKIE } from "@/lib/view-cookie";

const VIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function HomeShell({
  title,
  lastCollectedAt,
  feeds,
  initialArticles,
  initialHasMore,
  initialReadIds,
  initialView,
}: {
  title: string;
  lastCollectedAt: string | undefined;
  feeds: Feed[];
  initialArticles: Article[];
  initialHasMore: boolean;
  initialReadIds: string[];
  initialView: FeedView;
}) {
  const [view, setView] = useState<FeedView>(initialView);

  function handleViewChange(next: FeedView) {
    setView(next);
    document.cookie = `${VIEW_COOKIE}=${next}; path=/; max-age=${VIEW_COOKIE_MAX_AGE}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <ViewToggle view={view} onChange={handleViewChange} />
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          마지막 수집: {lastCollectedAt ? formatDateTime(lastCollectedAt) : "미수집"}
        </p>
      </header>
      <ArticleGrid
        feeds={feeds}
        initialArticles={initialArticles}
        initialHasMore={initialHasMore}
        initialReadIds={initialReadIds}
        view={view}
      />
    </div>
  );
}
