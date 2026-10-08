import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { getDictionary } from "@/lib/i18n/config";
import type { MyPlan } from "@/lib/supabase/use-my-plan";
import { PlanDetailsDialog } from "./plan-details-dialog";

/**
 * The plan details window: it must say exactly what was bought (the plan, subscription or one-time, the billing, the
 * price, the renewal), list what the plan includes and what a revision is, and offer the right way up.
 */
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => "/en/my-projects" }));

const dict = getDictionary("en");
const d = dict.account.planDetails;

afterEach(cleanup);

const open = (plan: MyPlan) => {
  render(
    <LanguageProvider>
      <PlanDetailsDialog plan={plan} open onOpenChange={() => {}} />
    </LanguageProvider>
  );
  return screen.getByRole("dialog");
};

describe("PlanDetailsDialog", () => {
  it("shows an annual subscription exactly as bought, with its features, the revision rule and Upgrade", () => {
    const dialog = open({ kind: "subscription", planKey: "brand", status: "active", billing: "annual", amountCents: 3490000, periodEnd: "2027-10-07T00:00:00Z", cancelAtPeriodEnd: false });
    const w = within(dialog);
    expect(w.getByRole("heading", { name: dict.plans.tiers.brand.name })).toBeTruthy();
    expect(w.getByText(d.subscription)).toBeTruthy();
    expect(w.getByText("$34,900")).toBeTruthy();
    expect(w.getByText(d.perPeriod.annual)).toBeTruthy();
    expect(w.getByText(d.billing.annual)).toBeTruthy();
    expect(w.getByText(d.renews)).toBeTruthy();
    expect(w.getByText("07-10-2027")).toBeTruthy();
    for (const feature of dict.plans.tiers.brand.features) expect(w.getByText(feature)).toBeTruthy();
    expect(w.getByText(dict.plans.everyPlan.revisionTerm)).toBeTruthy();

    const upgrade = w.getByRole("link", { name: new RegExp(d.upgrade) });
    expect(upgrade.getAttribute("href")).toContain("mailto:");
    expect(decodeURIComponent(upgrade.getAttribute("href") ?? "")).toContain(`${d.upgradeSubject} (${dict.plans.tiers.brand.name})`);
    // Compare plans opens the client's own audience (Brand is a business plan).
    expect(w.getByRole("link", { name: d.compare }).getAttribute("href")).toBe("/en/pricing?for=business");
  });

  it("says Ends on for a subscription cancelled at the period's end", () => {
    const w = within(open({ kind: "subscription", planKey: "creator", status: "active", billing: "monthly", amountCents: 38900, periodEnd: "2026-11-07T00:00:00Z", cancelAtPeriodEnd: true }));
    expect(w.getByText(d.ends)).toBeTruthy();
    expect(w.queryByText(d.renews)).toBeNull();
    expect(w.getByText("$389")).toBeTruthy();
  });

  it("shows a one-time video with its length, price and the way to order another - no Upgrade", () => {
    const w = within(open({ kind: "one_time", planKey: "personal", seconds: 60, amountCents: 77500, paidAt: "2026-10-05T12:00:00Z" }));
    expect(w.getByText(d.oneTime)).toBeTruthy();
    expect(w.getByText("$775")).toBeTruthy();
    expect(w.getByText(d.oneTimePaid)).toBeTruthy();
    expect(w.getByText("05-10-2026")).toBeTruthy();
    expect(w.getByRole("link", { name: d.orderAnother })).toBeTruthy();
    expect(w.queryByRole("link", { name: new RegExp(d.upgrade) })).toBeNull();
  });

  it("invites a client without a plan to pick one", () => {
    const w = within(open({ kind: "none" }));
    expect(w.getByRole("heading", { name: d.noneTitle })).toBeTruthy();
    expect(w.getByRole("link", { name: new RegExp(d.seePlans) }).getAttribute("href")).toBe("/en/pricing?for=business");
  });
});
