import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { getDictionary } from "@/lib/i18n/config";
import { PLANS, type Plan } from "@/lib/pricing";
import { PricingCard } from "./pricing-card";

/**
 * The pricing cards: the one-time video's length slider moves the price by the published rule ($299 for up to 20
 * seconds, +$119 per extra 10), and buying passes the chosen length to the checkout; a subscription card has neither.
 */
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => "/en/pricing" }));

const p = getDictionary("en").plans;
const personal = PLANS.individual.find((x) => x.key === "personal") as Plan;
const creator = PLANS.individual.find((x) => x.key === "creator") as Plan;

afterEach(cleanup);

function renderCard(plan: Plan, onBuy = vi.fn()) {
  render(
    <LanguageProvider>
      <PricingCard plan={plan} billing="monthly" href="/en/contact" onBuy={onBuy} />
    </LanguageProvider>
  );
  return onBuy;
}

describe("PricingCard", () => {
  it("prices a one-time video by the slider: 20 seconds for $299, 60 for $775, 2 minutes for $1,489", () => {
    renderCard(personal);
    const slider = screen.getByRole("slider", { name: p.lengthSlider.label });
    expect(screen.getByText("$299")).toBeTruthy();

    fireEvent.change(slider, { target: { value: "60" } });
    expect(screen.getByText("$775")).toBeTruthy();
    expect(slider.getAttribute("aria-valuetext")).toBe("60 seconds - $775");

    fireEvent.change(slider, { target: { value: "120" } });
    expect(screen.getByText("$1,489")).toBeTruthy();
  });

  it("buys the length on the slider", () => {
    const onBuy = renderCard(personal);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "40" } });
    fireEvent.click(screen.getByRole("button", { name: p.cta.oneTime }));
    expect(onBuy).toHaveBeenCalledWith(personal, 40);
  });

  it("gives a subscription no slider and no length", () => {
    const onBuy = renderCard(creator);
    expect(screen.queryByRole("slider")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: p.cta.subscribe }));
    expect(onBuy).toHaveBeenCalledWith(creator, undefined);
  });
});
