import { NextResponse } from "next/server";
import { paddle, paddleConfigured, type PaddleTransaction } from "@/lib/paddle";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTeamUser } from "@/lib/team";

export const runtime = "nodejs";

/**
 * `GET /api/invoices/<transaction id>/pdf` - the invoice's PDF. Paddle's PDF links expire within the hour, so the
 * invoice lists link here and the link is fetched on click: only for the signed-in client whose invoice it is (the
 * transaction's customer is the one on their profile) or for the team, then a redirect to Paddle's PDF.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^txn_[a-z0-9]{10,40}$/i.test(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const admin = createAdminClient();
  if (!paddleConfigured() || !admin) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  try {
    const tx = await paddle<PaddleTransaction>("GET", `/transactions/${id}`);
    if (!isTeamUser(auth.user)) {
      const { data: profile } = await admin.from("profiles").select("paddle_customer_id").eq("id", auth.user.id).maybeSingle();
      if (!profile?.paddle_customer_id || profile.paddle_customer_id !== tx.customer_id) return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const pdf = await paddle<{ url: string }>("GET", `/transactions/${id}/invoice`);
    return NextResponse.redirect(pdf.url, 302);
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
