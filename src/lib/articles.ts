import { getDb } from "./db";
import type { Article } from "./types";

export const PAGE_SIZE = 24;

type ArticleRow = Omit<Article, "is_read"> & { is_read: number };

function toArticle(row: ArticleRow): Article {
  return { ...row, is_read: !!row.is_read };
}

export async function getArticles(
  page: number,
  feedId?: string
): Promise<{ articles: Article[]; hasMore: boolean }> {
  const db = getDb();
  const offset = page * PAGE_SIZE;
  const rows = feedId
    ? db
        .prepare<[string, number, number], ArticleRow>(
          `select * from articles where feed_id = ? order by published_at desc limit ? offset ?`
        )
        .all(feedId, PAGE_SIZE, offset)
    : db
        .prepare<[number, number], ArticleRow>(
          `select * from articles order by published_at desc limit ? offset ?`
        )
        .all(PAGE_SIZE, offset);

  return { articles: rows.map(toArticle), hasMore: rows.length === PAGE_SIZE };
}

export async function getFeedLastFetched(): Promise<Record<string, string>> {
  const db = getDb();
  const rows = db
    .prepare<[], { feed_id: string; last_fetched_at: string }>(
      "select feed_id, last_fetched_at from feed_state"
    )
    .all();
  return Object.fromEntries(rows.map((row) => [row.feed_id, row.last_fetched_at]));
}

export async function setArticleRead(id: string, isRead: boolean): Promise<void> {
  const db = getDb();
  db.prepare("update articles set is_read = ? where id = ?").run(isRead ? 1 : 0, id);
}
