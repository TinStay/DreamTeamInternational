"use client";

import { useLanguage } from "@/lib/i18n/language-context";
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
        <div className="mb-10 lg:mb-12">
          <h2 className="mb-6 font-heading text-4xl font-bold text-foreground md:text-5xl">
            {faq.title1}{" "}
            <span className="text-section-accent">{faq.title2}</span>
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {faq.subtitle}
          </p>
        </div>

        <Accordion className="rounded-2xl border border-border/30 bg-card/60 px-4 shadow-sm backdrop-blur-sm sm:px-6">
          {faq.items.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`}>
              <AccordionTrigger className="py-4 text-base font-semibold text-foreground">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-[0.95rem] leading-relaxed text-muted-foreground">
                <p>{item.a}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
