"use client";

import { faviconUrl } from "@/lib/favicon";
import { feeds } from "@/lib/feeds";
import { formatDate } from "@/lib/format-date";
import type { Article } from "@/lib/types";

export function ArticleCard({
  article,
  layout = "list",
  isRead,
  onRead,
}: {
  article: Article;
  layout?: "list" | "grid";
  isRead: boolean;
  onRead: (id: string) => void;
}) {
  const isGrid = layout === "grid";
  const feed = feeds.find((f) => f.id === article.feed_id);
  const icon = faviconUrl(feed?.logo ?? feed?.url ?? article.link);

  return (
    <div
      className={
        (isGrid
          ? "flex flex-col gap-3 rounded-lg bg-card p-4 ring-1 ring-border"
          : "flex items-start gap-3 border-b py-3") +
        " transition-opacity" +
        (isRead ? " opacity-50" : "")
      }
    >
      {!isGrid && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" className="mt-1 size-6 shrink-0 rounded bg-muted" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onRead(article.id)}
          className={
            "font-medium leading-snug hover:underline" + (isGrid ? " line-clamp-2 min-h-11" : "")
          }
        >
          {article.title}
        </a>
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
          {isGrid && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={icon} alt="" className="size-3.5 rounded-sm bg-muted" />
          )}
          <span>{article.feed_name}</span>
          <span>·</span>
          <span>{formatDate(article.published_at)}</span>
        </div>
      </div>
    </div>
  );
}
