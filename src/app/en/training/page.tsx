import type { Metadata } from "next";
import { TrainingPageView } from "@/components/training/training-page-view";
import { en } from "@/lib/i18n/en";

export const metadata: Metadata = {
  title: en.training.metaTitle,
  description: en.training.metaDescription,
  alternates: {
    canonical: "/en/training",
    languages: {
      en: "/en/training",
      bg: "/bg/training",
    },
  },
};

export default function TrainingPageEn() {
  return <TrainingPageView />;
}
