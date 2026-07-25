import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

// ponytail: local SQLite file, fine for single-user local/dev use.
// Vercel serverless has no persistent disk — swap for a hosted DB (Supabase等) before deploying there.
const DB_PATH = process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "articlesift.db");

declare global {
  var __articlesiftDb: Database.Database | undefined;
}

function createDb(): Database.Database {
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    create table if not exists articles (
      id text primary key,
      feed_id text not null,
      feed_name text not null,
      title text not null,
      link text not null unique,
      guid text,
      summary text,
      thumbnail_url text,
      published_at text not null,
      is_read integer not null default 0,
      created_at text not null default (datetime('now'))
    );
    create index if not exists articles_published_at_idx on articles (published_at desc);

    create table if not exists feed_state (
      feed_id text primary key,
      last_fetched_at text not null
    );
  `);
  return db;
}

export function getDb(): Database.Database {
  if (!global.__articlesiftDb) {
    global.__articlesiftDb = createDb();
  }
  return global.__articlesiftDb;
}
