import { HomeShell } from "@/components/home-shell";
import { getArticles, getFeedLastFetched } from "@/lib/articles";
import { feeds } from "@/lib/feeds";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ articles, hasMore }, lastFetched] = await Promise.all([
    getArticles(0),
    getFeedLastFetched(),
  ]);
  const lastCollectedAt = Object.values(lastFetched).sort().at(-1);

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-8 px-6 py-10">
      <HomeShell
        title="TechBlogz"
        lastCollectedAt={lastCollectedAt}
        feeds={feeds}
        initialArticles={articles}
        initialHasMore={hasMore}
      />
    </div>
  );
}
