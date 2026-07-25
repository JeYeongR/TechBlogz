import { randomUUID } from "node:crypto";
import Parser from "rss-parser";
import { feeds } from "./feeds";
import { getDb } from "./db";

type FeedItem = Parser.Item & {
  enclosure?: { url?: string };
  "media:content"?: { $?: { url?: string } };
};

const parser = new Parser<Record<string, unknown>, FeedItem>({
  headers: { "User-Agent": "Mozilla/5.0 (compatible; ArticleSift/1.0)", Accept: "*/*" },
});

function extractThumbnail(item: FeedItem): string | null {
  return item.enclosure?.url ?? item["media:content"]?.$?.url ?? null;
}

// contentSnippet is already stripped; item.summary (Atom feeds) can be raw HTML.
function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function collectFeed(feed: (typeof feeds)[number]) {
  const db = getDb();
  const parsed = await parser.parseURL(feed.url);

  const insert = db.prepare(`
    insert or ignore into articles
      (id, feed_id, feed_name, title, link, guid, summary, thumbnail_url, published_at)
    values (@id, @feed_id, @feed_name, @title, @link, @guid, @summary, @thumbnail_url, @published_at)
  `);

  let inserted = 0;
  let itemsSeen = 0;
  for (const item of parsed.items) {
    if (!item.link) continue;
    itemsSeen++;
    const title = item.title ?? "(제목 없음)";
    const summary = stripHtml(item.contentSnippet ?? item.summary ?? "").slice(0, 500);
    const result = insert.run({
      id: randomUUID(),
      feed_id: feed.id,
      feed_name: feed.name,
      title,
      link: item.link,
      guid: item.guid ?? item.link,
      summary,
      thumbnail_url: extractThumbnail(item),
      published_at: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
    });
    if (result.changes > 0) inserted++;
  }

  db.prepare(
    "insert into feed_state (feed_id, last_fetched_at) values (?, ?) on conflict(feed_id) do update set last_fetched_at = excluded.last_fetched_at"
  ).run(feed.id, new Date().toISOString());

  return { feedId: feed.id, itemsSeen, inserted };
}

export async function collectAllFeeds() {
  const results = [];
  for (const feed of feeds) {
    try {
      results.push(await collectFeed(feed));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : String(err);
      results.push({ feedId: feed.id, itemsSeen: 0, inserted: 0, error: message });
    }
  }
  return results;
}
