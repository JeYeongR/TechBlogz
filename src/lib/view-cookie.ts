import type { FeedView } from "@/components/view-toggle";

export const VIEW_COOKIE = "articlesift_view";

export function parseView(raw: string | undefined): FeedView {
  return raw === "grid" ? "grid" : "list";
}
