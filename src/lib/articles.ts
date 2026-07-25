import { getSupabase } from "./supabase";
import type { Article } from "./types";

export const PAGE_SIZE = 24;

export async function getArticles(
  page: number,
  feedId?: string
): Promise<{ articles: Article[]; hasMore: boolean }> {
  const supabase = getSupabase();
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false })
    .range(from, to);

  if (feedId) {
    query = query.eq("feed_id", feedId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const articles = (data ?? []) as Article[];
  return { articles, hasMore: articles.length === PAGE_SIZE };
}

export async function getFeedLastFetched(): Promise<Record<string, string>> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("feed_state").select("feed_id, last_fetched_at");
  if (error) throw error;

  return Object.fromEntries((data ?? []).map((row) => [row.feed_id, row.last_fetched_at]));
}

export async function setArticleRead(id: string, isRead: boolean): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("articles").update({ is_read: isRead }).eq("id", id);
  if (error) throw error;
}
