export type Feed = {
  id: string;
  name: string;
  url: string;
  logo?: string;
};

export type Article = {
  id: string;
  feed_id: string;
  feed_name: string;
  title: string;
  link: string;
  guid: string | null;
  summary: string | null;
  thumbnail_url: string | null;
  published_at: string;
  is_read: boolean;
  created_at: string;
};
