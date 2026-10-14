"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

/**
 * The FAQ's questions a buyer asks on `/pricing`, by their `faq.groups` ids, in this order - the answers live once, in
 * the FAQ. "cost" leads (open) because it names every plan's price, so the page's HTML carries the whole price list
 * whichever audience's cards are on screen.
 */
const PRICING_QUESTION_IDS = [
  "cost",
  "one-time-vs-subscription",
  "annual-discount",
  "individual-for-business",
  "turnaround",
  "revisions",
  "what-you-need",
  "formats",
  "rights",
  "vs-filming",
] as const;

/**
 * `/pricing`'s questions, in the page's own palette. Closed answers stay in the HTML (`hiddenUntilFound` - the
 * browser's find-in-page opens them too), so crawlers and AI assistants read every answer. No FAQPage JSON-LD here:
 * the home page's FAQ already marks these questions up, and Google wants one instance per site.
 */
export function PricingFaq({ className }: { className?: string }) {
  const { t } = useLanguage();
  const all = t.faq.groups.flatMap((group) => group.items);
  const items = PRICING_QUESTION_IDS.flatMap((id) => all.filter((item) => item.id === id));

  return (
    <section aria-labelledby="pricing-faq-title" className={cn("mx-auto w-full max-w-[860px]", className)}>
      <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#9a9ba3]">{t.plans.faq.eyebrow}</p>
      <h2
        id="pricing-faq-title"
        className="mb-6 mt-2 text-center font-heading text-[clamp(22px,2.6vw,30px)] font-black uppercase leading-[1.05]"
      >
        {t.plans.faq.title}
      </h2>
      <Accordion hiddenUntilFound defaultValue={items[0] ? [items[0].id] : []} className="gap-2.5">
        {items.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="rounded-[16px] border border-white/[0.09] bg-[#141518] px-5 transition-[background-color,border-color] duration-200 ease-out hover:border-white/[0.16] hover:bg-[#17181c] sm:px-6"
          >
            <AccordionTrigger className="py-4 text-[15px] font-semibold text-[#f4f4f5] transition-[transform,color] duration-200 ease-out hover:translate-x-1 hover:no-underline sm:text-base">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-sm leading-relaxed text-[#9a9ba3] sm:text-[15px]">
              <p>{item.a}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
