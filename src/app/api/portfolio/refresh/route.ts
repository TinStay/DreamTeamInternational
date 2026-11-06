import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCrossSite } from "@/lib/server/form-guards";
import { isTeamUser } from "@/lib/team";

/** After a save in the admin dashboard: the portfolio page shows the new list on its next visit, not a minute later. */
export async function POST(request: Request) {
  if (isCrossSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!isTeamUser(auth.user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  revalidatePath("/[lang]/portfolio", "page");
  return NextResponse.json({ ok: true });
}
