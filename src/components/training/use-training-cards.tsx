"use client";

import type React from "react";
import { useMemo } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { contactProcessPath } from "@/lib/routes";
import { TrainingModalDetails, TrainingModalIncludes } from "./training-modal-rich";

export type TrainingExpandableCard = {
  id: string;
  title: string;
  description: string;
  src: string;
  ctaText: string;
  ctaLink: string;
  comingSoon?: boolean;
  comingSoonLabel?: string;
  includes: React.ReactNode | (() => React.ReactNode);
  details: React.ReactNode | (() => React.ReactNode);
};

export function useTrainingCards(): TrainingExpandableCard[] {
  const { t, language } = useLanguage();
  const tr = t.training;
  const contactHref = contactProcessPath(language);

  return useMemo(
    () => [
      {
        id: "individual",
        title: tr.cards.individual.title,
        description: tr.cards.individual.suitableFor,
        src: tr.cards.individual.image,
        ctaText: tr.cards.individual.cta,
        ctaLink: contactHref,
        includes: <TrainingModalIncludes copy={tr.cards.individual} />,
        details: <TrainingModalDetails copy={tr.cards.individual} />,
      },
      {
        id: "skool",
        title: tr.cards.skool.title,
        description: tr.cards.skool.suitableFor,
        src: tr.cards.skool.image,
        ctaText: tr.cards.skool.cta,
        ctaLink: tr.skoolUrl,
        includes: <TrainingModalIncludes copy={tr.cards.skool} />,
        details: <TrainingModalDetails copy={tr.cards.skool} />,
      },
      {
        id: "team",
        title: tr.cards.team.title,
        description: tr.cards.team.suitableFor,
        src: tr.cards.team.image,
        ctaText: tr.cards.team.cta,
        ctaLink: contactHref,
        includes: <TrainingModalIncludes copy={tr.cards.team} />,
        details: <TrainingModalDetails copy={tr.cards.team} />,
      },
    ],
    [contactHref, tr]
  );
}
