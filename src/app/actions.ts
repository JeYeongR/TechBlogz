"use server";

import { getArticles, setArticleRead } from "@/lib/articles";

export async function toggleRead(id: string, isRead: boolean) {
  await setArticleRead(id, isRead);
}

export async function loadMoreArticles(page: number, feedId?: string) {
  return getArticles(page, feedId);
}
