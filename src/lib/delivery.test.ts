import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { formatBytes, isApproved, progressOf, projectFromRow, statusLabelOf, timelineFor } from "@/lib/client-projects";
import { isLiveStatus, subscriptionRow } from "@/lib/subscriptions";
import { safeFileName } from "@/lib/supabase/storage";

describe("projectFromRow - delivery", () => {
  it("reads the uploaded film and both kinds of deliverable", () => {
    const p = projectFromRow({
      id: "p1",
      status: "review",
      delivery_video: { name: "Final.mp4", path: "u1/p1/video/1-Final.mp4", size: 5 * 1024 * 1024, type: "video/mp4" },
      files: [
        { name: "Final-9x16.mp4", path: "u1/p1/files/2-Final-9x16.mp4", size: 2048 },
        { name: "Old.mp4", url: "https://example.com/old.mp4", size: "18 MB" },
        { name: "Broken" },
      ],
      approved_at: "2026-10-06T10:00:00Z",
    });
    expect(p.deliveryVideo).toEqual({ name: "Final.mp4", path: "u1/p1/video/1-Final.mp4", size: 5 * 1024 * 1024, type: "video/mp4" });
    expect(p.files).toEqual([
      { name: "Final-9x16.mp4", url: null, path: "u1/p1/files/2-Final-9x16.mp4", size: "2 KB" },
      { name: "Old.mp4", url: "https://example.com/old.mp4", path: null, size: "18 MB" },
    ]);
    expect(p.approvedAt).toBe("2026-10-06T10:00:00Z");
  });

  it("treats a missing or malformed film as none", () => {
    expect(projectFromRow({ id: "p", delivery_video: null }).deliveryVideo).toBeNull();
    expect(projectFromRow({ id: "p", delivery_video: { name: "x" } }).deliveryVideo).toBeNull();
  });
});

describe("formatBytes / safeFileName", () => {
  it("formats sizes", () => {
    expect(formatBytes(null)).toBe("");
    expect(formatBytes(500)).toBe("1 KB");
    expect(formatBytes(3.5 * 1024 * 1024)).toBe("3.5 MB");
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe("2.00 GB");
  });

  it("keeps file names Storage-safe", () => {
    expect(safeFileName("Summer Sale (final) 9x16.MP4")).toBe("Summer-Sale-final-9x16.mp4");
    expect(safeFileName("???.mov")).toBe("file.mov");
    expect(safeFileName("noext")).toBe("noext");
  });
});

describe("subscriptions", () => {
  it("counts only live statuses", () => {
    expect(isLiveStatus("active")).toBe(true);
    expect(isLiveStatus("past_due")).toBe(true);
    expect(isLiveStatus("canceled")).toBe(false);
    expect(isLiveStatus("incomplete_expired")).toBe(false);
  });

  it("mirrors a Stripe subscription, or skips one without a user", () => {
    const sub = {
      id: "sub_1",
      customer: "cus_1",
      status: "active",
      cancel_at_period_end: false,
      metadata: { user_id: "u1", plan_key: "creator" },
      items: { data: [{ current_period_end: 1_790_000_000, price: { unit_amount: 389000, currency: "usd", recurring: { interval: "year" } } }] },
    } as unknown as Stripe.Subscription;
    expect(subscriptionRow(sub)).toMatchObject({ id: "sub_1", user_id: "u1", customer_id: "cus_1", plan_key: "creator", status: "active", current_period_end: new Date(1_790_000_000 * 1000).toISOString(), billing: "annual", amount_cents: 389000, currency: "usd" });
    expect(subscriptionRow({ ...sub, metadata: {} } as unknown as Stripe.Subscription)).toBeNull();
  });
});

describe("progress and timeline", () => {
  const base = projectFromRow({ id: "p", status: "brief", created_at: "2026-10-01T09:00:00Z", due_date: "2026-10-20" });
  const labels = { brief: "Brief", scripting: "Scripting", production: "Production", review: "Review", delivered: "Delivered" };

  it("starts a new brief at 5% and ends at 100%", () => {
    expect(progressOf(base)).toBe(5);
    expect(progressOf({ ...base, status: "delivered" })).toBe(100);
  });

  it("never puts the deadline under Delivered - only the approval date, on the Approved step", () => {
    expect(timelineFor(base, labels).at(-1)?.date).toBeNull();
    const approved = timelineFor({ ...base, status: "delivered", approvedAt: "2026-10-18T12:00:00Z" }, { ...labels, approved: "Approved" });
    expect(approved.at(-2)).toMatchObject({ title: "Delivered", date: null, done: true });
    expect(approved.at(-1)).toMatchObject({ title: "Approved", date: "2026-10-18", done: true, approved: true });
  });

  it("walks the stages in order: done before, current at, ahead after", () => {
    const steps = timelineFor({ ...base, status: "production" }, labels);
    expect(steps.map((s) => [s.title, s.done, s.current])).toEqual([
      ["Brief", true, false],
      ["Scripting", true, false],
      ["Production", false, true],
      ["Review", false, false],
      ["Delivered", false, false],
    ]);
    // A revision sends a project back to production - the timeline follows it back.
    expect(timelineFor({ ...base, status: "review" }, labels).find((s) => s.current)?.title).toBe("Review");
  });

  it("closes with a green Approved step only once the client has approved", () => {
    const withApproved = { ...labels, approved: "Approved" };
    // Delivered by the team without an approval: five steps, all done, no Approved.
    const delivered = timelineFor({ ...base, status: "delivered" }, withApproved);
    expect(delivered).toHaveLength(5);
    expect(delivered.every((s) => s.done && !s.approved)).toBe(true);
    // In review with an old approval date is not approved (the database never allows it, but the page must not claim it).
    expect(timelineFor({ ...base, status: "review", approvedAt: "2026-10-18T12:00:00Z" }, withApproved)).toHaveLength(5);
    // A custom timeline gets the Approved step too, once.
    const custom = { ...base, status: "delivered" as const, approvedAt: "2026-10-18T12:00:00Z", timeline: [{ title: "Kick-off", date: null, note: null, done: true }] };
    expect(timelineFor(custom, withApproved).map((s) => s.title)).toEqual(["Kick-off", "Approved"]);
  });

  it("reads Approved as the status once approved, and the stage otherwise", () => {
    const withApproved = { ...labels, approved: "Approved" };
    expect(isApproved({ status: "delivered", approvedAt: "2026-10-18T12:00:00Z" })).toBe(true);
    expect(isApproved({ status: "delivered", approvedAt: null })).toBe(false);
    expect(isApproved({ status: "production", approvedAt: "2026-10-18T12:00:00Z" })).toBe(false);
    expect(statusLabelOf({ status: "delivered", approvedAt: "2026-10-18T12:00:00Z" }, withApproved)).toBe("Approved");
    expect(statusLabelOf({ status: "delivered", approvedAt: null }, withApproved)).toBe("Delivered");
    expect(statusLabelOf({ status: "production", approvedAt: null }, withApproved)).toBe("Production");
  });
});
