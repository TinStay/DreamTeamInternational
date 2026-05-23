import type { Metadata } from "next";
import { TrainingPageView } from "@/components/training/training-page-view";
import { zh } from "@/lib/i18n/zh";
import { localeAlternates } from "@/lib/routes";

export const metadata: Metadata = {
  title: zh.training.metaTitle,
  description: zh.training.metaDescription,
  alternates: {
    canonical: "/zh/training",
    languages: localeAlternates("/training"),
  },
};

export default function ZhTrainingPage() {
  return <TrainingPageView />;
}
