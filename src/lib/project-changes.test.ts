import { describe, expect, it } from "vitest";
import {
  CHANGE_PRICES,
  canRequest,
  deadlineCost,
  formatsOf,
  maxExtraSeconds,
  minDeadline,
  splitCost,
  TOPUP_CENTS_PER_SECOND,
  requestErrorOf,
  requestFromRow,
  reviewAverage,
  reviewFromRow,
} from "./project-changes";

/**
 * The change-request rules the client sees - they must match what the database charges (supabase/changes.sql):
 * $50 a day for an earlier deadline, length from the video time (missing seconds bought at the one-time price), a format
 * for the film's length in seconds, $49 for a revision, nothing once the film is delivered or approved.
 */
describe("formatsOf", () => {
  it("reads every way a format is written, in order and without repeats", () => {
    expect(formatsOf("9:16 vertical")).toEqual(["vertical"]);
    expect(formatsOf("9:16 vertical + 16:9 horizontal")).toEqual(["vertical", "horizontal"]);
    expect(formatsOf("16:9, 1:1 square, 4:5")).toEqual(["horizontal", "square", "portrait"]);
    expect(formatsOf("4:3 classic + 3:4 portrait + 21:9 cinema")).toEqual(["classic", "portrait", "cinema"]);
    // 21:9 is not 1:9-something, 16:9 is not 6:9.
    expect(formatsOf("21:9")).toEqual(["cinema"]);
    expect(formatsOf("Vertical")).toEqual(["vertical"]);
    expect(formatsOf("16:9 + 16:9")).toEqual(["horizontal"]);
    expect(formatsOf(null)).toEqual([]);
    expect(formatsOf("Something else")).toEqual([]);
  });
});

describe("maxExtraSeconds / splitCost", () => {
  it("lets the film grow past the video time left (by up to two minutes), never past 10 minutes, in 5-second steps", () => {
    expect(maxExtraSeconds(30, 1000)).toBe(570);
    expect(maxExtraSeconds(30, 12)).toBe(130);
    expect(maxExtraSeconds(30, 0)).toBe(120);
    expect(maxExtraSeconds(600, 1000)).toBe(0);
  });

  it("pays from the video time first and buys the rest at the one-time price ($11.90 a second)", () => {
    expect(TOPUP_CENTS_PER_SECOND).toBe(1190);
    expect(splitCost(30, 100)).toEqual({ fromBalance: 30, bought: 0, cents: 0 });
    expect(splitCost(60, 45)).toEqual({ fromBalance: 45, bought: 15, cents: 15 * 1190 });
    expect(splitCost(20, -5)).toEqual({ fromBalance: 0, bought: 20, cents: 20 * 1190 });
  });
});

describe("deadlineCost / minDeadline", () => {
  it("charges $50 for each day sooner, nothing for later or for a first date", () => {
    expect(deadlineCost("2026-10-20", "2026-10-17")).toEqual({ daysEarlier: 3, cents: 3 * CHANGE_PRICES.deadlinePerDayCents });
    expect(deadlineCost("2026-10-20", "2026-10-19")).toEqual({ daysEarlier: 1, cents: 5000 });
    expect(deadlineCost("2026-10-20", "2026-10-25")).toEqual({ daysEarlier: 0, cents: 0 });
    expect(deadlineCost(null, "2026-10-25")).toEqual({ daysEarlier: 0, cents: 0 });
    // Across a month end and a daylight-saving change, days are whole days.
    expect(deadlineCost("2026-11-02", "2026-10-24").daysEarlier).toBe(9);
  });

  it("never lets a deadline come sooner than two days from today", () => {
    expect(minDeadline(new Date(2026, 9, 8))).toBe("2026-10-10");
    expect(minDeadline(new Date(2026, 11, 31))).toBe("2027-01-02");
  });
});

describe("canRequest", () => {
  it("opens each change only at the stages it makes sense, and none once approved or delivered", () => {
    const at = (status: "brief" | "scripting" | "production" | "review" | "delivered", approvedAt: string | null = null) => ({ status, approvedAt });
    expect(canRequest(at("brief"), "deadline")).toBe(true);
    expect(canRequest(at("review"), "deadline")).toBe(false);
    expect(canRequest(at("production"), "duration")).toBe(true);
    expect(canRequest(at("review"), "format")).toBe(true);
    expect(canRequest(at("brief"), "revision")).toBe(false);
    expect(canRequest(at("review"), "revision")).toBe(true);
    for (const kind of ["deadline", "duration", "format", "revision"] as const) {
      expect(canRequest(at("delivered"), kind)).toBe(false);
      expect(canRequest(at("review", "2026-10-06T10:00:00Z"), kind)).toBe(false);
    }
  });
});

describe("requests and reviews from the database", () => {
  it("reads a request row and the database's refusals", () => {
    const r = requestFromRow({ id: "r1", project_id: "p1", kind: "format", details: { format: "1:1 square" }, cost_seconds: 30, cost_cents: 0, status: "requested", created_at: "2026-10-08T10:00:00Z" });
    expect(r).toMatchObject({ kind: "format", costSeconds: 30, costCents: 0, status: "requested", paidAt: null });
    expect(requestErrorOf("ERROR: over_max_length")).toBe("over_max_length");
    expect(requestErrorOf("something odd")).toBe("generic");
    expect(requestErrorOf(undefined)).toBe("generic");
  });

  it("reads a review only when all three aspects are 1-5, and averages them", () => {
    expect(reviewFromRow({ quality: 5, speed: 4, attitude: 5, comment: "" })).toEqual({ quality: 5, speed: 4, attitude: 5, comment: null, updatedAt: null });
    expect(reviewFromRow({ quality: 6, speed: 4, attitude: 5 })).toBeNull();
    expect(reviewFromRow(null)).toBeNull();
    expect(reviewAverage({ quality: 5, speed: 4, attitude: 5 })).toBe(4.7);
  });
});
