import type { Metadata } from "next";
import { TrainingPageView } from "@/components/training/training-page-view";
import { en } from "@/lib/i18n/en";
import { localeAlternates } from "@/lib/routes";

export const metadata: Metadata = {
  title: en.training.metaTitle,
  description: en.training.metaDescription,
  alternates: {
    canonical: "/en/training",
    languages: localeAlternates("/training"),
  },
};

export default function TrainingPageEn() {
  return <TrainingPageView />;
}
