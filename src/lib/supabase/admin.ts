import { createClient } from "@supabase/supabase-js";

/**
 * Supabase with the service role: bypasses row level security, so it is only for trusted server code that must write on a
 * client's behalf - here, the payment webhook adding purchased seconds. Never import this from a component.
 * Returns `null` while `SUPABASE_SERVICE_ROLE_KEY` is not set.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
