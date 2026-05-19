import type { Metadata } from "next";
import { en } from "@/lib/i18n/en";
import { TrainingDetailPageView } from "@/components/training/training-detail-page-view";

type Params = { slug: string };

export function generateMetadata({ params }: { params: Params }): Metadata {
  const map = en.training.cards;
  const title =
    params.slug === "individual"
      ? map.individual.title
      : params.slug === "skool"
        ? map.skool.title
        : params.slug === "team" || params.slug === "corporate"
          ? map.team.title
          : map.individual.title;

  return {
    title: `${title} | ${en.training.metaTitle}`,
    description: en.training.metaDescription,
    alternates: {
      canonical: `/en/training/${params.slug}`,
      languages: {
        en: `/en/training/${params.slug}`,
        bg: `/bg/training/${params.slug}`,
      },
    },
  };
}

export default function TrainingDetailEnPage({ params }: { params: Params }) {
  return <TrainingDetailPageView slug={params.slug} />;
}

