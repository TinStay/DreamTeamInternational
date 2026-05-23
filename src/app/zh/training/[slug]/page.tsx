import type { Metadata } from "next";
import { zh } from "@/lib/i18n/zh";
import { TrainingDetailPageView } from "@/components/training/training-detail-page-view";
import { localeAlternates } from "@/lib/routes";

type Params = { slug: string };

export function generateMetadata({ params }: { params: Params }): Metadata {
  const map = zh.training.cards;
  const title =
    params.slug === "individual"
      ? map.individual.title
      : params.slug === "skool"
        ? map.skool.title
        : params.slug === "team" || params.slug === "corporate"
          ? map.team.title
          : map.individual.title;

  return {
    title: `${title} | ${zh.training.metaTitle}`,
    description: zh.training.metaDescription,
    alternates: {
      canonical: `/zh/training/${params.slug}`,
      languages: localeAlternates(`/training/${params.slug}`),
    },
  };
}

export default function TrainingDetailZhPage({ params }: { params: Params }) {
  return <TrainingDetailPageView slug={params.slug} />;
}
