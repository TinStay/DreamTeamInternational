import type { Metadata } from "next";
import { HomePage } from "@/app/home-page";
import { localeAlternates } from "@/lib/routes";

export const metadata: Metadata = {
  title: "DreamTeam | AI 视频制作",
  description:
    "DreamTeam 为全球品牌打造高影响力 AI 视频——写实、动画或混合风格。脚本策划、视频制作、快速交付。",
  alternates: {
    canonical: "/zh",
    languages: localeAlternates(),
  },
};

export default function ZhHomePage() {
  return <HomePage />;
}
