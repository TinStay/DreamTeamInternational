"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AnimatedFeatureCard } from "@/components/ui/animated-feature-card";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

const CARD_CONFIG = [
  { id: "individual", color: "orange" as const, index: "001" },
  // Skool training temporarily hidden (restore with index "002" and team back to "003").
  // { id: "skool", color: "purple" as const, index: "002" },
  { id: "team", color: "blue" as const, index: "002" },
] as const;

export function TrainingFeatureCards() {
  const { t, language } = useLanguage();
  const tr = t.training;

  const cards = useMemo(
    () =>
      CARD_CONFIG.map(({ id, color, index }) => {
        const copy = tr.cards[id];
        return {
          id,
          color,
          index,
          tag: copy.featureTag,
          title: copy.featureSummary,
          imageSrc: copy.image,
          href: `/${language}/training/${id}`,
        };
      }),
    [language, tr.cards]
  );

  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 gap-10 md:grid-cols-2 md:gap-8 lg:gap-10",
        // Columns follow the card count so the row always fills the container width.
        cards.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"
      )}
    >
      {cards.map((card) => (
        <Link key={card.id} href={card.href} className="block h-full">
          <AnimatedFeatureCard
            index={card.index}
            tag={card.tag}
            title={card.title}
            imageSrc={card.imageSrc}
            color={card.color}
            className="h-full max-w-none"
          />
        </Link>
      ))}
    </div>
  );
}
