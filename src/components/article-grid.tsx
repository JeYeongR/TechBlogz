"use client";

import { useState, useTransition } from "react";
import { ArticleCard } from "@/components/article-card";
import { Button } from "@/components/ui/button";
import { loadMoreArticles, toggleRead } from "@/app/actions";
import { faviconUrl } from "@/lib/favicon";
import type { Article, Feed } from "@/lib/types";

export function ArticleGrid({
  feeds,
  initialArticles,
  initialHasMore,
  view = "list",
}: {
  feeds: Feed[];
  initialArticles: Article[];
  initialHasMore: boolean;
  view?: "list" | "grid";
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [selectedFeedId, setSelectedFeedId] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const [isFilterPending, startFilterTransition] = useTransition();

  function handleRead(id: string) {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    startTransition(() => {
      toggleRead(id, true);
    });
  }

  function handleLoadMore() {
    startTransition(async () => {
      const nextPage = page + 1;
      const { articles: more, hasMore: more_hasMore } = await loadMoreArticles(
        nextPage,
        selectedFeedId
      );
      setArticles((prev) => [...prev, ...more]);
      setPage(nextPage);
      setHasMore(more_hasMore);
    });
  }

  function handleSelectFeed(feedId: string | undefined) {
    setSelectedFeedId(feedId);
    startFilterTransition(async () => {
      const { articles: first, hasMore: firstHasMore } = await loadMoreArticles(0, feedId);
      setArticles(first);
      setPage(0);
      setHasMore(firstHasMore);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleSelectFeed(undefined)}
          disabled={isFilterPending}
          className={
            "rounded-full border px-3 py-1 text-sm disabled:opacity-50" +
            (selectedFeedId === undefined ? " bg-foreground text-background" : "")
          }
        >
          전체
        </button>
        {feeds.map((feed) => (
          <button
            key={feed.id}
            type="button"
            onClick={() => handleSelectFeed(feed.id)}
            disabled={isFilterPending}
            className={
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm disabled:opacity-50" +
              (selectedFeedId === feed.id ? " bg-foreground text-background" : "")
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={faviconUrl(feed.logo ?? feed.url)} alt="" className="size-4 rounded-sm" />
            {feed.name}
          </button>
        ))}
      </div>
      {articles.length === 0 ? (
        <p className="text-muted-foreground">표시할 글이 없습니다.</p>
      ) : (
        <div
          className={
            (view === "grid"
              ? "grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4"
              : "flex flex-col") +
            (isFilterPending ? " opacity-50 transition-opacity" : " transition-opacity")
          }
        >
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} layout={view} onRead={handleRead} />
          ))}
        </div>
      )}
      {hasMore && (
        <Button variant="outline" onClick={handleLoadMore} disabled={isPending} className="self-center">
          {isPending ? "불러오는 중..." : "더 보기"}
        </Button>
      )}
    </div>
  );
}
