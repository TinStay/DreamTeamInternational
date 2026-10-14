import { LEGAL_ENTITY } from "@/lib/brand";
import { formatDateDisplay } from "@/lib/dates";
import { getDictionary, type Language } from "@/lib/i18n/config";
import { EMAIL_PRIMARY, GOOGLE_REVIEWS, PHONE_PRIMARY, PHONE_SECONDARY } from "@/lib/contact-info";
import { ANNUAL_PAID_MONTHS, ANNUAL_PERCENT, AUDIENCES, ONE_TIME, formatPrice } from "@/lib/pricing";
import { planFacts, priceHighlights, type PlanFacts } from "@/lib/pricing-summary";
import { PROJECTS } from "@/lib/projects";
import {
  aboutPath,
  homePath,
  investorsPath,
  portfolioPath,
  pricingPath,
  projectPath,
  projectsPath,
  servicePath,
  servicesPath,
} from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";
import { getServiceSlug } from "@/lib/services/constants";
import { SOCIAL_LINKS } from "@/lib/social-links";

/*
 * `/llms.txt` and `/llms-full.txt` - the brief an AI assistant reads to
 * describe Keplerbay (the llms.txt convention: a Markdown index of what the
 * site is and where its key pages are; the "full" file carries the content
 * itself). Both are rendered from the dictionaries, the price list
 * (`lib/pricing.ts`) and the project data, so they can never fall behind the
 * pages: the index is the company in one screen - what it does, for whom,
 * the prices (every plan, in USD), the facts clients ask about (delivery,
 * revisions, rights, payment), the services, the case studies with their
 * results, the numbers, the process, contact; the full file adds what each
 * plan includes and leaves out, the service details, every case study's
 * highlights and the complete FAQ.
 */

const HEADINGS: Record<Language, Record<string, string>> = {
  en: {
    facts: "Key facts",
    pricing: "Pricing (USD)",
    services: "Services",
    cases: "Client case studies",
    numbers: "Keplerbay in numbers",
    process: "How we work",
    faq: "Frequently asked questions",
    contact: "Contact",
    pages: "Key pages",
  },
};

/** The price list's sentences - machine-facing, so they live with the brief rather than in the dictionaries. */
const PRICE_WORDS: Record<
  Language,
  {
    intro: (url: string) => string;
    audience: (label: string) => string;
    oneTime: (plan: PlanFacts) => string;
    subscription: (plan: PlanFacts) => string;
    custom: string;
    popular: string;
    includes: string;
    annual: string;
    summary: (prices: ReturnType<typeof priceHighlights>) => string;
  }
> = {
  en: {
    intro: (url) =>
      `All prices are in US dollars and listed on ${url}. Checkout runs through Paddle, the merchant of record, which adds sales tax or VAT where it applies and issues the invoice.`,
    audience: (label) => `${label} plans`,
    oneTime: (plan) => `${formatPrice(plan.price!)} one-time, no subscription`,
    subscription: (plan) =>
      `${formatPrice(plan.price!)} per month, or ${formatPrice(plan.annualTotal!)} a year billed annually (≈ ${formatPrice(plan.annualTotal! / 12)}/month)`,
    custom: "custom pricing, quoted for your volume and terms",
    popular: "most popular",
    includes: "Includes",
    annual: `Annual billing: pay for ${ANNUAL_PAID_MONTHS} months, get 12 (${ANNUAL_PERCENT}% off), on every monthly plan.`,
    summary: (prices) =>
      `Pricing: one video from ${formatPrice(prices.oneTimeFrom)} (no subscription); individual plans from ${formatPrice(prices.individualFrom)}/month; business plans from ${formatPrice(prices.businessFrom)}/month; Enterprise custom. All prices in USD.`,
  },
};

const FACT_WORDS: Record<Language, Record<string, string>> = {
  en: {
    what: "What we do: finished AI videos made by our team - you send a brief, we write, direct and produce the video. No filming, prompting or software needed on your side.",
    who: "For: businesses, brands and agencies (Business plans) and creators and individuals (Individual plans).",
    where: "Where: the United States first, Europe and worldwide - the whole process runs online.",
    rights:
      "Rights: Business plans include full commercial use; Individual plans are for personal and creator use (advertising a business requires a Business plan).",
    formats: "Kinds of video we make",
    legal: `Company: Keplerbay is the brand of ${LEGAL_ENTITY}. Online orders are sold through Paddle.com, the merchant of record.`,
    office: "Office",
    profiles: "Profiles",
  },
};

function services(lang: Language) {
  return getDictionary(lang).services.items.flatMap((item) => {
    const slug = getServiceSlug(item.imgSrc);
    return slug ? [{ ...item, url: absoluteUrl(servicePath(lang, slug)) }] : [];
  });
}

/** The price list: each plan's price, volume and who it is for - `full` adds what it includes and leaves out. */
function pricing(lang: Language, full: boolean) {
  const t = getDictionary(lang).plans;
  const w = PRICE_WORDS[lang];
  const plans = planFacts(lang);
  const lines = [w.intro(absoluteUrl(pricingPath(lang))), ""];

  for (const audience of AUDIENCES) {
    lines.push(`### ${w.audience(t.audience[audience])}`, "", `${t.subtitle[audience]} ${absoluteUrl(`${pricingPath(lang)}?for=${audience}`)}`, "");
    for (const plan of plans.filter((candidate) => candidate.audience === audience)) {
      const price = plan.custom ? w.custom : plan.oneTime ? w.oneTime(plan) : w.subscription(plan);
      lines.push(`- **${plan.name}**${plan.popular ? ` (${w.popular})` : ""} - ${price}. ${plan.volume}. ${plan.for}.`);
      // The length rule, and what the longest one-time video comes to.
      if (plan.oneTime) lines.push(`  - ${t.lengthSlider.hint} (${formatPrice(plan.maxPrice!)} for ${ONE_TIME.maxSecs} seconds)`);
      // The index keeps a plan to its headline features; the full file lists everything, and what it leaves out.
      lines.push(`  - ${w.includes}: ${(full ? plan.features : plan.features.slice(0, 5)).join("; ")}${full ? "" : "; …"}`);
      if (full && plan.missing.length) lines.push(`  - ${t.notIncluded} ${plan.missing.join("; ")}`);
    }
    lines.push("");
  }

  lines.push(`- ${w.annual}`);
  lines.push(`- **${t.everyPlan.title}:** ${t.everyPlan.items.join("; ")}.`);
  lines.push(`- **${t.everyPlan.revisionTerm}** ${t.everyPlan.revisionText}`);
  lines.push(`- **${t.everyPlan.scriptTerm}** ${t.everyPlan.scriptText}`);
  lines.push("");
  return lines;
}

/** One language's brief; `full` adds every plan's details, the service descriptions, every case study's highlight + tags and the whole FAQ. */
function section(lang: Language, full: boolean) {
  const t = getDictionary(lang);
  const h = HEADINGS[lang];
  const f = FACT_WORDS[lang];
  const lines: string[] = [];

  lines.push(t.hero.seoHeading, "");

  lines.push(`## ${h.facts}`, "");
  lines.push(`- ${f.what}`);
  lines.push(`- ${f.who}`);
  lines.push(`- ${f.where}`);
  lines.push(`- ${PRICE_WORDS[lang].summary(priceHighlights())} ${absoluteUrl(pricingPath(lang))}`);
  for (const item of t.plans.everyPlan.items) lines.push(`- ${item}`);
  lines.push(`- ${f.rights}`);
  lines.push(`- ${f.legal}`);
  lines.push(`- Google: ${GOOGLE_REVIEWS.rating}/5 (${GOOGLE_REVIEWS.count} ${t.footer.googleReviews}) - ${GOOGLE_REVIEWS.reviewsUrl}`);
  lines.push(`- ${t.footer.reviews}: Clutch, Google`);
  lines.push("");

  lines.push(`## ${h.pricing}`, "", ...pricing(lang, full));

  lines.push(`## ${h.services}`, "");
  for (const service of services(lang)) {
    lines.push(`- **${service.title}** - ${service.seoDescription} ${service.url}`);
    if (full) lines.push(`  - ${service.modal.description}`);
  }
  lines.push(`- ${f.formats}: ${Object.values(t.packages.items).map((item) => `${item.title} (${item.line})`).join("; ")}`);
  lines.push("");

  lines.push(`## ${h.cases}`, "");
  for (const project of PROJECTS) {
    const item = t.projects.items[project.id];
    lines.push(`- **${item.name}** - ${item.headline}. ${item.description} ${absoluteUrl(projectPath(lang, project.id))}`);
    if (full) lines.push(`  - ${item.highlight} (${item.tags.join(" · ")})`);
  }
  lines.push("");

  lines.push(`## ${h.numbers}`, "");
  for (const stat of t.stats.items) lines.push(`- ${stat.value} ${stat.label}`);
  lines.push("");

  lines.push(`## ${h.process}`, "");
  t.process.steps.forEach((step, index) => lines.push(`${index + 1}. **${step.title}** - ${step.description}`));
  lines.push("");

  lines.push(`## ${h.faq}`, "");
  for (const group of t.faq.groups) {
    // The index keeps the questions clients ask first (pricing, how we work); the full file has every topic.
    if (!full && group.key !== "pricing" && group.key !== "process") continue;
    lines.push(`### ${group.label}`, "");
    for (const item of group.items) lines.push(`- **${item.q}** ${item.a}`);
    lines.push("");
  }

  lines.push(`## ${h.contact}`, "");
  lines.push(`- ${t.contact.email}: ${EMAIL_PRIMARY.label}`);
  lines.push(`- ${t.contact.phone}: ${PHONE_PRIMARY.label}, ${PHONE_SECONDARY.label}`);
  lines.push(`- ${f.office}: ${t.contact.addressVal}`);
  // None while the profiles are parked (`SOCIAL_LINKS` empty).
  if (SOCIAL_LINKS.length) lines.push(`- ${f.profiles}: ${SOCIAL_LINKS.map((social) => social.href).join(", ")}`);
  lines.push("");

  lines.push(`## ${h.pages}`, "");
  lines.push(`- ${t.legal.home}: ${absoluteUrl(homePath(lang))}`);
  lines.push(`- ${t.header.pricingPage}: ${absoluteUrl(pricingPath(lang))}`);
  lines.push(`- ${t.header.services}: ${absoluteUrl(servicesPath(lang))}`);
  lines.push(`- ${t.header.projects}: ${absoluteUrl(projectsPath(lang))}`);
  lines.push(`- ${t.header.portfolio}: ${absoluteUrl(portfolioPath(lang))}`);
  lines.push(`- ${t.header.about}: ${absoluteUrl(aboutPath(lang))}`);
  lines.push(`- ${t.header.investors}: ${absoluteUrl(investorsPath(lang))}`);
  lines.push("");

  return lines.join("\n");
}

function head() {
  return [
    "# Keplerbay — AI Video Production Company",
    "",
    `> ${getDictionary("en").seo.organizationDescription}`,
    "",
    `- Website: ${absoluteUrl(homePath("en"))}`,
    `- ${PRICE_WORDS.en.summary(priceHighlights())} ${absoluteUrl(pricingPath("en"))}`,
    `- Email: ${EMAIL_PRIMARY.label}`,
    `- Full brief with every plan's details, service, case study and FAQ: ${absoluteUrl("/llms-full.txt")}`,
    // The build's date: the brief is regenerated on every deploy.
    `- Last updated: ${formatDateDisplay(new Date().toISOString().slice(0, 10))}`,
    "",
  ].join("\n");
}

/** `/llms.txt`: the index - the English brief. */
export function llmsIndex() {
  return [head(), section("en", false)].join("\n");
}

/** `/llms-full.txt`: everything. */
export function llmsFull() {
  return [head(), section("en", true)].join("\n");
}
