import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Supabase on the server (server components, route handlers): reads the visitor's session from the cookies. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a server component: the proxy refreshes the session cookies, so this can be ignored.
        }
      },
    },
  });
}
