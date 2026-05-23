import type { Metadata } from "next";
import { HomePage } from "@/app/home-page";
import { localeAlternates } from "@/lib/routes";

export const metadata: Metadata = {
  title: "DreamTeam | AI Видео Продукция",
  description:
    "DreamTeam създава високоефективни AI видеа за брандове по света — реалистични, анимирани или хибридни. Сценарий, продукция и бързи срокове.",
  alternates: {
    canonical: "/bg",
    languages: localeAlternates(),
  },
};

export default function BgHomePage() {
  return <HomePage />;
}

