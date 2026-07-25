import Parser from "rss-parser";
import { readFileSync } from "node:fs";

const FEED_TIMEOUT_MS = 15_000;

const feeds = JSON.parse(readFileSync(new URL("../feeds.json", import.meta.url)));
const parser = new Parser({
  headers: { "User-Agent": "Mozilla/5.0 (compatible; ArticleSift/1.0)", Accept: "*/*" },
  timeout: FEED_TIMEOUT_MS,
});

const results = await Promise.allSettled(
  feeds.map((feed) => parser.parseURL(feed.url).then((parsed) => ({ feed, parsed })))
);

let failed = false;
results.forEach((result, i) => {
  const feed = feeds[i];
  if (result.status === "fulfilled") {
    console.log(`ok  ${feed.id} (${result.value.parsed.items.length} items)`);
  } else {
    failed = true;
    const err = result.reason;
    console.error(`fail ${feed.id}: ${err instanceof Error ? err.message : err}`);
  }
});

// A feed being temporarily unreachable (network blip, WAF/bot block, rate limit)
// doesn't mean feeds.json is wrong, and collectAllFeeds() already handles
// per-feed failures at runtime — so don't block the build over it.
if (failed) {
  console.error("일부 피드에 접근할 수 없습니다 (네트워크/차단 문제일 수 있음). 빌드는 계속 진행합니다.");
}

process.exit(0);
