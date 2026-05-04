import type { Metadata } from "next";
import { TrainingPageView } from "@/components/training/training-page-view";
import { bg } from "@/lib/i18n/bg";

export const metadata: Metadata = {
  title: bg.training.metaTitle,
  description: bg.training.metaDescription,
  alternates: {
    canonical: "/bg/training",
    languages: {
      en: "/en/training",
      bg: "/bg/training",
    },
  },
};

export default function TrainingPageBg() {
  return <TrainingPageView />;
}
