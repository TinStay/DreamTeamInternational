// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

/** The daily job's door: only Vercel's cron, with the secret, gets in; it then voids and expires the orders. */
const job = vi.hoisted(() => ({ voidOverdueOrderInvoices: vi.fn(async (_s: unknown, _now: Date, onVoided?: (i: { id: string; orderId: string | null }) => Promise<void>) => {
  await onVoided?.({ id: "in_1", orderId: "o1" });
  return ["in_1"];
}) }));
vi.mock("@/lib/invoice-orders", () => job);
vi.mock("@/lib/stripe", () => ({ getStripe: () => ({}) }));
const orders = vi.hoisted(() => ({ updateOrder: vi.fn(async () => undefined) }));
vi.mock("@/lib/orders", () => orders);

const { GET } = await import("./route");
const SECRET = "a-long-cron-secret-for-tests";
const call = (auth?: string) => GET(new Request("http://localhost:3000/api/cron/void-overdue-invoices", { headers: auth ? { authorization: auth } : {} }));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = SECRET;
});

describe("/api/cron/void-overdue-invoices", () => {
  it("runs for Vercel's cron and marks the voided orders not completed", async () => {
    const res = await call(`Bearer ${SECRET}`);
    expect(await res.json()).toEqual({ voided: 1 });
    expect(orders.updateOrder).toHaveBeenCalledWith("o1", { status: "expired" });
  });

  it("refuses a missing or wrong secret, and refuses everyone while no secret is set", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer nope")).status).toBe(401);
    delete process.env.CRON_SECRET;
    expect((await call(`Bearer ${SECRET}`)).status).toBe(401);
    expect(job.voidOverdueOrderInvoices).not.toHaveBeenCalled();
  });
});
