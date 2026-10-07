import { describe, expect, it } from "vitest";
import { checkoutFor } from "@/lib/checkout";
import { PLAN_SECONDS, summarizeLedger } from "@/lib/credits";

describe("summarizeLedger", () => {
  it("adds purchases and subtracts spending", () => {
    const s = summarizeLedger([
      { seconds: 40, kind: "purchase", plan_key: "creator", created_at: "2026-10-01T10:00:00Z" },
      { seconds: -15, kind: "spend", plan_key: null, created_at: "2026-10-02T10:00:00Z" },
    ]);
    expect(s.balance).toBe(25);
    expect(s.added).toBe(40);
    expect(s.planKey).toBe("creator");
  });

  it("names the latest purchase as the plan and ignores unknown packs", () => {
    const s = summarizeLedger([
      { seconds: 20, kind: "purchase", plan_key: "personal", created_at: "2026-10-01T10:00:00Z" },
      { seconds: 60, kind: "purchase", plan_key: "pro", created_at: "2026-10-05T10:00:00Z" },
      { seconds: 10, kind: "purchase", plan_key: "nonsense", created_at: "2026-09-01T10:00:00Z" },
    ]);
    expect(s.planKey).toBe("pro");
    expect(s.balance).toBe(90);
  });

  it("is empty for a new client", () => {
    expect(summarizeLedger([])).toEqual({ balance: 0, added: 0, planKey: null });
  });
});

describe("checkoutFor", () => {
  it("prices a one-time Personal pack", () => {
    expect(checkoutFor("personal", "monthly")).toMatchObject({ amountCents: 29900, oneTime: true, seconds: PLAN_SECONDS.personal });
  });

  it("prices a monthly plan and gives its monthly seconds", () => {
    expect(checkoutFor("creator", "monthly")).toMatchObject({ amountCents: 38900, oneTime: false, interval: "month", seconds: 40 });
  });

  it("charges ten months for a year and credits twelve", () => {
    expect(checkoutFor("pro", "annual")).toMatchObject({ amountCents: 62900 * 10, interval: "year", seconds: 60 * 12 });
  });

  it("refuses custom and unknown plans", () => {
    expect(checkoutFor("enterprise", "monthly")).toBeNull();
    expect(checkoutFor("free-video", "monthly")).toBeNull();
  });
});

describe("formatVideoTime", () => {
  it("shows seconds alone under a minute, minutes and seconds from there", async () => {
    const { formatVideoTime } = await import("@/lib/account-info");
    expect(formatVideoTime(95)).toBe("1 min 35 sec");
    expect(formatVideoTime(120)).toBe("2 min 0 sec");
    expect(formatVideoTime(15)).toBe("15 sec");
    expect(formatVideoTime(0)).toBe("0 sec");
  });
});
