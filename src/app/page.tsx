import { cookies } from "next/headers";
import { HomeShell } from "@/components/home-shell";
import { getArticles, getFeedLastFetched } from "@/lib/articles";
import { feeds } from "@/lib/feeds";
import { parseReadIds, READ_IDS_COOKIE } from "@/lib/read-ids";
import { parseView, VIEW_COOKIE } from "@/lib/view-cookie";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [[{ articles, hasMore }, lastFetched], cookieStore] = await Promise.all([
    Promise.all([getArticles(0), getFeedLastFetched()]),
    cookies(),
  ]);
  const lastCollectedAt = Object.values(lastFetched).sort().at(-1);
  const initialReadIds = parseReadIds(cookieStore.get(READ_IDS_COOKIE)?.value);
  const initialView = parseView(cookieStore.get(VIEW_COOKIE)?.value);

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-8 px-6 py-10">
      <HomeShell
        title="TechBlogz"
        lastCollectedAt={lastCollectedAt}
        feeds={feeds}
        initialArticles={articles}
        initialHasMore={hasMore}
        initialReadIds={initialReadIds}
        initialView={initialView}
      />
    </div>
  );
}
