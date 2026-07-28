"use server";

import { getArticles } from "@/lib/articles";

export async function loadMoreArticles(page: number, feedId?: string) {
  return getArticles(page, feedId);
}
