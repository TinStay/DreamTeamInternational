import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Paddle Billing - the payments behind every Keplerbay purchase. Paddle is the **merchant of record**: it sells to the
 * client, works out and remits sales tax / VAT, and issues the invoice; the payout comes to DT A I.
 *
 * Server side only (the API key). Set up in `PADDLE_SETUP.md`:
 * - `PADDLE_API_KEY` - an API key (Paddle → Developer tools → Authentication); payments are simply off without it;
 * - `PADDLE_ENVIRONMENT` - `sandbox` (the test account) or `production`; sandbox unless it says production;
 * - `PADDLE_WEBHOOK_SECRET` - the notification destination's secret key (`/api/paddle/webhook`);
 * - `PADDLE_TAX_CATEGORY` - the product tax category of the video work (`standard` unless set - another one must be
 *   enabled on the account first).
 * The browser side (`lib/paddle-client.ts`) uses `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` + `NEXT_PUBLIC_PADDLE_ENVIRONMENT`.
 */
export type PaddleEnvironment = "sandbox" | "production";

export function paddleEnvironment(): PaddleEnvironment {
  return process.env.PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox";
}

export function paddleConfigured(): boolean {
  return Boolean(process.env.PADDLE_API_KEY);
}

const API = { sandbox: "https://sandbox-api.paddle.com", production: "https://api.paddle.com" } as const;
const VENDORS = { sandbox: "https://sandbox-vendors.paddle.com", production: "https://vendors.paddle.com" } as const;

/** A subscription in the Paddle dashboard (the team's admin email links it). */
export function paddleDashboardUrl(kind: "subscriptions" | "transactions" | "customers", id: string): string {
  const path = kind === "subscriptions" ? "subscriptions-v2" : kind === "transactions" ? "transactions-v2" : "customers-v2";
  return `${VENDORS[paddleEnvironment()]}/${path}/${id}`;
}

/** Paddle's own reason for refusing a request - what the team needs to see to fix it. */
export class PaddleError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    detail: string,
  ) {
    super(detail || code);
    this.name = "PaddleError";
  }
}

type Query = Record<string, string | number | undefined>;

/** One call to the Paddle API; returns its `data`. Throws `PaddleError` on a refusal, or when payments are off. */
export async function paddle<T>(method: "GET" | "POST" | "PATCH", path: string, body?: unknown, query?: Query): Promise<T> {
  const key = process.env.PADDLE_API_KEY;
  if (!key) throw new PaddleError(503, "not_configured", "PADDLE_API_KEY is not set");
  const url = new URL(path, API[paddleEnvironment()]);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Paddle-Version": "1" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { data?: T; error?: { code?: string; detail?: string } };
  if (!res.ok) throw new PaddleError(res.status, json.error?.code ?? "error", json.error?.detail ?? res.statusText);
  return json.data as T;
}

/**
 * Verifies a webhook's `Paddle-Signature` header (`ts=<unix seconds>;h1=<hex HMAC-SHA256 of "<ts>:<raw body>">`), and that
 * it is recent - five minutes either way - so an old, captured notification cannot be replayed.
 */
export function verifyPaddleSignature(raw: string, header: string | null, secret: string, nowMs = Date.now()): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(";").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  ) as { ts?: string; h1?: string };
  const ts = Number(parts.ts);
  if (!parts.h1 || !Number.isFinite(ts) || Math.abs(nowMs / 1000 - ts) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${parts.ts}:${raw}`).digest();
  const given = Buffer.from(parts.h1, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** The custom data Keplerbay puts on a transaction (copied by Paddle onto its subscription and every renewal). */
export type PaddleCustomData = Partial<Record<string, string>> | null;

/** A Paddle price, as carried on a transaction or subscription item (the parts we read). */
export type PaddlePrice = {
  id?: string;
  description?: string;
  unit_price?: { amount: string; currency_code: string };
  billing_cycle?: { interval: "day" | "week" | "month" | "year"; frequency: number } | null;
};

export type PaddleSubscription = {
  id: string;
  status: "active" | "canceled" | "past_due" | "paused" | "trialing";
  customer_id: string;
  custom_data: PaddleCustomData;
  current_billing_period?: { starts_at: string; ends_at: string } | null;
  next_billed_at?: string | null;
  scheduled_change?: { action: "cancel" | "pause" | "resume"; effective_at: string } | null;
  items?: { price?: PaddlePrice | null; quantity?: number }[];
  transaction_id?: string | null;
};

export type PaddleTransaction = {
  id: string;
  status: "draft" | "ready" | "billed" | "paid" | "completed" | "canceled" | "past_due";
  customer_id?: string | null;
  subscription_id?: string | null;
  invoice_number?: string | null;
  origin?: string;
  collection_mode?: "automatic" | "manual";
  custom_data: PaddleCustomData;
  currency_code?: string;
  created_at: string;
  billed_at?: string | null;
  billing_details?: { payment_terms?: { interval: string; frequency: number } | null; additional_information?: string | null } | null;
  details?: { totals?: { grand_total?: string; tax?: string; subtotal?: string } | null } | null;
  items?: { price?: PaddlePrice | null }[];
  checkout?: { url?: string | null } | null;
};

/** A webhook notification (the parts we read). */
export type PaddleEvent = { event_id?: string; event_type: string; occurred_at?: string; data: Record<string, unknown> };
