import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/** Refreshes the Supabase sign-in session on page requests (see `lib/supabase/proxy.ts`). */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Pages only: not the static files, images, videos or the metadata routes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico|txt|xml|woff2?)$).*)"],
};
