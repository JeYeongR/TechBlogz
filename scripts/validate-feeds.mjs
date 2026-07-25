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

if (failed) {
  console.error("feeds.json validation failed — fix or remove broken feeds before deploying.");
  process.exit(1);
}

process.exit(0);
