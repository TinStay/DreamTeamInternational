import { createBrowserClient } from "@supabase/ssr";

/** Supabase in the browser (the sign-in popup, the header's account menu). One instance per call is fine - it shares the session cookie. */
export const createClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
