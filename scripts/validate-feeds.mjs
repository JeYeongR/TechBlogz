import Parser from "rss-parser";
import { readFileSync } from "node:fs";

const feeds = JSON.parse(readFileSync(new URL("../feeds.json", import.meta.url)));
const parser = new Parser({
  headers: { "User-Agent": "Mozilla/5.0 (compatible; ArticleSift/1.0)", Accept: "*/*" },
});

let failed = false;
for (const feed of feeds) {
  try {
    const parsed = await parser.parseURL(feed.url);
    console.log(`ok  ${feed.id} (${parsed.items.length} items)`);
  } catch (err) {
    failed = true;
    console.error(`fail ${feed.id}: ${err instanceof Error ? err.message : err}`);
  }
}

if (failed) {
  console.error("feeds.json validation failed — fix or remove broken feeds before deploying.");
  process.exit(1);
}
