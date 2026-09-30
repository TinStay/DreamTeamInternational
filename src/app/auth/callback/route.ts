import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";

/**
 * Where Supabase sends the visitor back after Google / Apple / Microsoft or an email link: trades the `code` for a
 * session (set as cookies) and lands them on `next` - a path on this site only, so the link cannot be used to bounce
 * someone to another host. A failure lands on the home page with `?auth=error`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requested = searchParams.get("next") ?? "/en/account";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/en/account";

  if (code && supabaseConfigured) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/en?auth=error`);
}
