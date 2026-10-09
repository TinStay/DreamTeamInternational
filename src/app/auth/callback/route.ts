import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { safeNextPath } from "@/lib/routes";

/**
 * Where Supabase sends the visitor back after Google / Apple / Microsoft or an email link: trades the `code` for a
 * session (set as cookies) and lands them on `next` (Your Projects by default) - a path on this site only, so the link cannot be used to bounce
 * someone to another host. A failure lands on the home page with `?auth=error`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // `safeNextPath` also refuses `/\host`, which a browser reads as `//host`.
  const next = safeNextPath(searchParams.get("next")) ?? "/en/my-projects";

  if (code && supabaseConfigured) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/en?auth=error`);
}
