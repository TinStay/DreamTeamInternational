"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { IconCoins, IconMovie, IconRoute } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { JourneyItem } from "@/components/ui/scroll-journey";
import { ButtonWithIcon, sideTabClass, sideTabDiscClass } from "@/components/ui/button-with-icon";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ctaPillClassName } from "@/components/ui/button";
import { contactProcessPath, servicesPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

/*
 * The FAQ: the questions in three topics (`faq.groups` - pricing & timing,
 * how we work, videos & rights), a topic menu on the left (a row of tabs on
 * phones) and the topic's questions as an accordion on the right, the first
 * one open; a switch slides the new list in, an answer opens and closes with
 * the accordion's own height animation. The menu wears the side-tab dress
 * (`sideTabClass`: the active topic as the site's CTA pill with its icon in
 * the gradient disc on the left). Under the list the site's quote pill (the
 * services page) and an outline pill to the contact page. On the home journey
 * the heading, the menu and the list are the parts that travel.
 * FAQPage structured data covers every question, whatever topic is open.
 */

const GROUP_ICONS = { pricing: IconCoins, process: IconRoute, videos: IconMovie } as const;
type GroupKey = keyof typeof GROUP_ICONS;

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The tabs primitive paints its own active look through `data-active` (and the `line` list variant) rules, which
 * outrank the side-tab dress's plain classes - so the pill's surface is restated under those very variants.
 */
const TAB_ACTIVE =
  "after:hidden data-active:text-white dark:data-active:text-neutral-900 group-data-[variant=line]/tabs-list:data-active:bg-neutral-900 group-data-[variant=line]/tabs-list:data-active:shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-white dark:group-data-[variant=line]/tabs-list:data-active:shadow-[0_12px_32px_rgba(255,255,255,0.14)]";

export function FaqSection({ className }: { className?: string }) {
  const { t, language } = useLanguage();
  const faq = t.faq;
  const [active, setActive] = useState<string>(faq.groups[0]?.key ?? "pricing");

  // FAQPage structured data — read by Google (rich results) and AI answer engines.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.groups.flatMap((group) =>
      group.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      }))
    ),
  };

  return (
    <section id="faq" className={cn("relative w-full py-16 sm:py-20", className)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4">
        {/* Journey parts (home): the heading first, then the topic menu from the left and the questions from the right. */}
        <JourneyItem kind="title" className="mb-10 text-center lg:mb-12">
          <h2 className="mb-6 font-heading text-[2.75rem] leading-[1.06] font-extrabold sm:text-5xl md:text-6xl text-foreground">
            {faq.title1} <span className="text-section-accent">{faq.title2}</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{faq.subtitle}</p>
        </JourneyItem>

        <Tabs
          value={active}
          onValueChange={(value) => setActive(String(value))}
          orientation="vertical"
          className="mx-auto w-full max-w-5xl flex-col gap-6 md:flex-row md:items-start md:gap-10 lg:gap-14"
        >
          <JourneyItem index={0} from="left" className="md:w-64 md:shrink-0 lg:w-72">
            <TabsList variant="line" className="flex h-auto w-full flex-row flex-wrap gap-2 bg-transparent p-0 md:flex-col md:items-stretch">
              {faq.groups.map((group) => {
                const Icon = GROUP_ICONS[group.key as GroupKey] ?? IconMovie;
                const isActive = group.key === active;
                return (
                  <TabsTrigger key={group.key} value={group.key} className={cn(sideTabClass(isActive), TAB_ACTIVE)}>
                    <span className={sideTabDiscClass(isActive)}>
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span>{group.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </JourneyItem>

          <JourneyItem index={1} from="right" className="min-w-0 flex-1">
            {faq.groups.map((group) => (
              <TabsContent key={group.key} value={group.key} className="min-w-0">
                {/* A fresh list slides in with each topic; the first answer starts open. */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
                  <Accordion className="gap-3 sm:gap-4" defaultValue={[`${group.key}-0`]}>
                    {group.items.map((item, i) => (
                      <AccordionItem
                        key={item.q}
                        value={`${group.key}-${i}`}
                        className="overflow-hidden rounded-2xl border border-card-border bg-card/70 px-5 shadow-sm backdrop-blur-sm transition-shadow duration-300 data-open:shadow-elevated-soft sm:rounded-3xl sm:px-7"
                      >
                        <AccordionTrigger className="py-4 text-base font-semibold text-foreground sm:py-5 sm:text-lg">{item.q}</AccordionTrigger>
                        <AccordionContent className="pb-5 text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
                          <p>{item.a}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </motion.div>
              </TabsContent>
            ))}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <ButtonWithIcon href={servicesPath(language)} surface="auto">
                {t.services.quoteCta}
              </ButtonWithIcon>
              <Link
                href={contactProcessPath(language)}
                className={cn(
                  ctaPillClassName,
                  // The quote pill's height and type ramp (`md`), so the two read as a pair.
                  "h-12 border border-card-border bg-card-elevated text-foreground transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-[1px] hover:bg-muted/60 hover:shadow-sm lg:text-base"
                )}
              >
                {faq.cta}
              </Link>
            </div>
          </JourneyItem>
        </Tabs>
      </div>
    </section>
  );
}
