import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n/config";
import { llmsFull, llmsIndex } from "@/lib/llms";
import { ANNUAL_PERCENT, AUDIENCES, ONE_TIME, PLANS, formatPrice } from "@/lib/pricing";
import { priceHighlights } from "@/lib/pricing-summary";
import { organizationGraph, pricingGraph } from "@/lib/seo-graph";

/*
 * The prices quoted in words - the SEO copy, the FAQ, the AI brief, the structured data - against the price list in
 * `lib/pricing.ts`. Search engines and AI assistants repeat these sentences as fact, so a price changed in one place
 * and not the other must fail here, not in someone's answer.
 */

const t = getDictionary("en");
const prices = priceHighlights();
const listed = AUDIENCES.flatMap((audience) => PLANS[audience]).flatMap((plan) => (plan.price === undefined ? [] : [plan.price]));

describe("the prices in the copy", () => {
  it("quotes the right 'from' prices in the home and pricing page descriptions", () => {
    expect(t.seo.home.description).toContain(`One video from ${formatPrice(prices.oneTimeFrom)}`);
    expect(t.seo.home.description).toContain(`plans from ${formatPrice(prices.individualFrom)}/month`);
    expect(t.plans.metaDescription).toContain(`one video from ${formatPrice(prices.oneTimeFrom)}`);
    expect(t.plans.metaDescription).toContain(`creator plans from ${formatPrice(prices.individualFrom)}/month`);
    expect(t.plans.metaDescription).toContain(`business plans from ${formatPrice(prices.businessFrom)}/month`);
    expect(t.seo.organizationDescription).toContain(`from ${formatPrice(prices.oneTimeFrom)}`);
    expect(t.seo.organizationDescription).toContain(`${formatPrice(prices.individualFrom)} for individuals`);
    expect(t.seo.organizationDescription).toContain(`${formatPrice(prices.businessFrom)} for businesses`);
  });

  it("names every list price, and the one-time rule, in the FAQ's cost answer", () => {
    const cost = t.faq.groups.flatMap((group) => group.items).find((item) => item.id === "cost");
    expect(cost).toBeDefined();
    for (const price of listed) expect(cost!.a).toContain(formatPrice(price));
    expect(cost!.a).toContain(`+${formatPrice(ONE_TIME.extra)} for every extra ${ONE_TIME.step} seconds`);
  });

  it("states the annual discount the toggle gives", () => {
    const annual = t.faq.groups.flatMap((group) => group.items).find((item) => item.id === "annual-discount");
    expect(annual?.a).toContain(`about ${ANNUAL_PERCENT}% off`);
  });

  it("lists every plan with its price in both AI briefs", () => {
    for (const brief of [llmsIndex(), llmsFull()]) {
      for (const audience of AUDIENCES) {
        for (const plan of PLANS[audience]) {
          const name = t.plans.tiers[plan.key].name;
          const line = brief.split("\n").find((candidate) => candidate.startsWith(`- **${name}**`));
          expect(line, name).toBeDefined();
          if (plan.price !== undefined) expect(line).toContain(formatPrice(plan.price));
        }
      }
    }
  });

  it("puts every priced plan in the /pricing structured data, in USD", () => {
    const graph = pricingGraph("en");
    const catalog = graph["@graph"][1] as { itemListElement: { itemListElement: { name: string; price?: number; priceCurrency?: string }[] }[] };
    const offers = catalog.itemListElement.flatMap((group) => group.itemListElement);
    expect(offers).toHaveLength(AUDIENCES.reduce((sum, audience) => sum + PLANS[audience].length, 0));
    for (const audience of AUDIENCES) {
      for (const plan of PLANS[audience]) {
        const offer = offers.find((candidate) => candidate.name === t.plans.tiers[plan.key].name);
        expect(offer?.price).toBe(plan.price);
        if (plan.price !== undefined) expect(offer?.priceCurrency).toBe("USD");
      }
    }
  });

  it("gives the organization its price range", () => {
    const organization = organizationGraph("en")["@graph"][0] as { priceRange: string };
    expect(organization.priceRange).toBe(`${formatPrice(prices.oneTimeFrom)} - ${formatPrice(prices.highest)}+`);
  });
});
