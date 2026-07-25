create extension if not exists "pgcrypto";

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  feed_id text not null,
  feed_name text not null,
  title text not null,
  link text not null unique,
  guid text,
  summary text,
  thumbnail_url text,
  published_at timestamptz not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists articles_published_at_idx on articles (published_at desc);

create table if not exists feed_state (
  feed_id text primary key,
  last_fetched_at timestamptz not null
);
