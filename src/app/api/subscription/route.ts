import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { setCancelAtPeriodEnd } from "@/lib/subscriptions";
import { createRateLimiter, isCrossSite } from "@/lib/server/form-guards";

const isRateLimited = createRateLimiter(60_000, 10);

const STATUS = { no_subscription: 404, not_configured: 503, failed: 502 } as const;

/**
 * The signed-in client's subscription: `{ action: "cancel" }` stops it at the end of the period they have paid for (no
 * further charges; the plan and the video time stay until then), `{ action: "resume" }` takes the cancellation back.
 * Same-site requests only, a few per minute per client.
 */
export async function POST(request: Request) {
  if (isCrossSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  if (isRateLimited(auth.user.id, Date.now())) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { action?: unknown };
  if (body.action !== "cancel" && body.action !== "resume") return NextResponse.json({ error: "invalid_action" }, { status: 400 });

  const result = await setCancelAtPeriodEnd(getStripe(), auth.user.id, body.action === "cancel");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: STATUS[result.error] });
  return NextResponse.json({ cancelAtPeriodEnd: result.cancelAtPeriodEnd, periodEnd: result.periodEnd });
}
