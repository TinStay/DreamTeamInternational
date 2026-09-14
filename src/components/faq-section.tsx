"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { JourneyItem } from "@/components/ui/scroll-journey";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqSection({ className }: { className?: string }) {
  const { t } = useLanguage();
  const faq = t.faq;

  // FAQPage structured data — read by Google (rich results) and AI answer engines.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section id="faq" className={cn("relative w-full py-16 sm:py-20", className)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4">
        {/* Journey parts (home): heading first, then the questions alternating from the left / right. */}
        <JourneyItem kind="title" className="mb-10 text-center lg:mb-12">
          <h2 className="mb-6 font-heading text-[2.75rem] leading-[1.06] font-extrabold sm:text-5xl md:text-6xl text-foreground">
            {faq.title1}{" "}
            <span className="text-section-accent">{faq.title2}</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {faq.subtitle}
          </p>
        </JourneyItem>

        <Accordion className="space-y-3 sm:space-y-4">
          {faq.items.map((item, i) => (
            <JourneyItem key={item.q} index={i}>
            <AccordionItem
              value={`faq-${i}`}
              className="overflow-hidden rounded-2xl border border-card-border bg-card/70 px-6 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:px-8"
            >
              <AccordionTrigger className="py-5 text-base font-semibold text-foreground sm:py-6 sm:text-lg">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
                <p>{item.a}</p>
              </AccordionContent>
            </AccordionItem>
            </JourneyItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
