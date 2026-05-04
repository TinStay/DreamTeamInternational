"use client";

import Link from "next/link";
import { IconChevronLeft } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { TrainingExpandableCards, type TrainingExpandableCard } from "./training-expandable-cards";
import { TrainingModalRich } from "./training-modal-rich";

export function TrainingPageView() {
  const { t, language } = useLanguage();
  const tr = t.training;
  const homeHref = language === "bg" ? "/bg" : "/";
  const contactHref = `${homeHref}#contact`;

  const cards: TrainingExpandableCard[] = [
    {
      id: "consultation",
      title: tr.cards.consultation.title,
      description: tr.cards.consultation.suitableFor,
      src: tr.cards.consultation.image,
      ctaText: tr.cards.consultation.cta,
      ctaLink: contactHref,
      content: <TrainingModalRich copy={tr.cards.consultation} />,
    },
    {
      id: "skool",
      title: tr.cards.skool.title,
      description: tr.cards.skool.suitableFor,
      src: tr.cards.skool.image,
      ctaText: tr.cards.skool.cta,
      ctaLink: tr.skoolUrl,
      content: <TrainingModalRich copy={tr.cards.skool} />,
    },
    {
      id: "corporate",
      title: tr.cards.corporate.title,
      description: tr.cards.corporate.suitableFor,
      src: tr.cards.corporate.image,
      ctaText: tr.cards.corporate.cta,
      ctaLink: contactHref,
      content: <TrainingModalRich copy={tr.cards.corporate} />,
    },
  ];

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <div className="relative flex-1 w-full px-4 pb-28 pt-24 lg:pb-32 lg:pt-32">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_90%_55%_at_50%_-20%,rgba(99,102,241,0.14),transparent),radial-gradient(ellipse_70%_45%_at_100%_40%,rgba(112,51,255,0.08),transparent),radial-gradient(ellipse_55%_38%_at_0%_55%,rgba(14,165,233,0.06),transparent)]" />

        <div className="mx-auto w-full max-w-5xl">
          <Link
            href={homeHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 mb-6 inline-flex items-center text-muted-foreground hover:text-primary"
            )}
          >
            <IconChevronLeft className="mr-1 h-4 w-4" />
            {t.legal.backToHome}
          </Link>

          <header className="mb-12 text-center md:mb-14 md:text-left">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{tr.eyebrow}</p>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">{tr.title}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:mx-0">{tr.subtitle}</p>
          </header>

          <TrainingExpandableCards cards={cards} />
        </div>
      </div>

      <Footer />
      <MobileNav />
    </main>
  );
}
