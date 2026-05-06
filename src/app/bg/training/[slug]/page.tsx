import type { Metadata } from "next";
import { bg } from "@/lib/i18n/bg";
import { TrainingDetailPageView } from "@/components/training/training-detail-page-view";

type Params = { slug: "consultation" | "skool" | "corporate" };

export function generateMetadata({ params }: { params: Params }): Metadata {
  const map = bg.training.cards;
  const title =
    params.slug === "consultation"
      ? map.consultation.title
      : params.slug === "skool"
        ? map.skool.title
        : map.corporate.title;

  return {
    title: `${title} | ${bg.training.metaTitle}`,
    description: bg.training.metaDescription,
    alternates: {
      canonical: `/bg/training/${params.slug}`,
      languages: {
        en: `/en/training/${params.slug}`,
        bg: `/bg/training/${params.slug}`,
      },
    },
  };
}

export default function TrainingDetailBgPage({ params }: { params: Params }) {
  return <TrainingDetailPageView slug={params.slug} />;
}

