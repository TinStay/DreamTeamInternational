import { NextResponse } from "next/server";
import { paddleConfigured } from "@/lib/paddle";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRateLimiter, isCrossSite } from "@/lib/server/form-guards";
import { customerFor } from "@/lib/paddle-customers";
import { createCheckoutTransaction, lineItem } from "@/lib/paddle-checkout";

const isRateLimited = createRateLimiter(60_000, 10);

/** What the checkout line reads, per kind of paid request. */
const LINE: Record<string, string> = { deadline: "Earlier deadline", revision: "Extra revision" };

/**
 * Pays for a change request that costs money (an earlier deadline, an extra revision). The request was created - and
 * priced - in the database by `request_project_change()` (supabase/changes.sql); here the signed-in client's own request,
 * still `awaiting_payment`, is turned into a Paddle transaction for exactly its `cost_cents`, whose id the browser opens in
 * the overlay checkout. Nothing about the price comes from the browser. The webhook marks it `requested` (paid) once the
 * money is in, and the team then sees it.
 */
export async function POST(request: Request) {
  if (isCrossSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const admin = createAdminClient();
  if (!paddleConfigured() || !admin) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  if (isRateLimited(auth.user.id, Date.now())) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { requestId?: unknown };
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const { data: row } = await admin
    .from("project_requests")
    .select("id, project_id, user_id, kind, cost_cents, status, projects(title)")
    .eq("id", requestId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (row.status !== "awaiting_payment" || !(Number(row.cost_cents) > 0)) return NextResponse.json({ error: "not_payable" }, { status: 409 });

  const title = (row.projects as { title?: string } | null)?.title ?? "";
  const customData = { user_id: auth.user.id, request_id: String(row.id), project_id: String(row.project_id), purchase_type: "project_request", kind: String(row.kind) };
  const productName = `Keplerbay - ${LINE[String(row.kind)] ?? "Project change"}`;

  try {
    const customerId = await customerFor(auth.user.id, { email: auth.user.email });
    if (!customerId) return NextResponse.json({ error: "not_configured" }, { status: 503 });
    const transaction = await createCheckoutTransaction({
      customerId,
      customData,
      items: [lineItem({ name: productName, description: title ? `For "${title.slice(0, 120)}"` : productName, amountCents: Number(row.cost_cents) })],
    });
    await admin.from("project_requests").update({ paddle_transaction_id: transaction.id }).eq("id", row.id);
    return NextResponse.json({ transactionId: transaction.id });
  } catch (err) {
    console.error("project request checkout: paddle refused", err);
    return NextResponse.json({ error: "checkout_failed" }, { status: 502 });
  }
}
