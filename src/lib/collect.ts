import Parser from "rss-parser";
import { feeds } from "./feeds";
import { getSupabase } from "./supabase";

type FeedItem = Parser.Item & {
  enclosure?: { url?: string };
  "media:content"?: { $?: { url?: string } };
};

const parser = new Parser<Record<string, unknown>, FeedItem>({
  headers: { "User-Agent": "Mozilla/5.0 (compatible; TechBlogz/1.0)", Accept: "*/*" },
});

function extractThumbnail(item: FeedItem): string | null {
  return item.enclosure?.url ?? item["media:content"]?.$?.url ?? null;
}

// contentSnippet is already stripped; item.summary (Atom feeds) can be raw HTML.
function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function collectFeed(feed: (typeof feeds)[number]) {
  const supabase = getSupabase();
  const parsed = await parser.parseURL(feed.url);

  const rows = [];
  let itemsSeen = 0;
  for (const item of parsed.items) {
    if (!item.link) continue;
    itemsSeen++;
    const title = item.title ?? "(제목 없음)";
    const summary = stripHtml(item.contentSnippet ?? item.summary ?? "").slice(0, 500);
    rows.push({
      feed_id: feed.id,
      feed_name: feed.name,
      title,
      link: item.link,
      guid: item.guid ?? item.link,
      summary,
      thumbnail_url: extractThumbnail(item),
      published_at: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
    });
  }

  let inserted = 0;
  if (rows.length > 0) {
    const { data, error } = await supabase
      .from("articles")
      .upsert(rows, { onConflict: "link", ignoreDuplicates: true })
      .select("id");
    if (error) throw error;
    inserted = data?.length ?? 0;
  }

  const { error: stateError } = await supabase
    .from("feed_state")
    .upsert({ feed_id: feed.id, last_fetched_at: new Date().toISOString() }, { onConflict: "feed_id" });
  if (stateError) throw stateError;

  return { feedId: feed.id, itemsSeen, inserted };
}

export async function collectAllFeeds() {
  const results = [];
  for (const feed of feeds) {
    try {
      results.push(await collectFeed(feed));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ feedId: feed.id, itemsSeen: 0, inserted: 0, error: message });
    }
  }
  return results;
}
