import { createClient } from "@supabase/supabase-js";

declare global {
  var __techblogzSupabase: ReturnType<typeof createSupabaseClient> | undefined;
}

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function getSupabase() {
  const client = global.__techblogzSupabase ?? createSupabaseClient();
  global.__techblogzSupabase = client;
  return client;
}
