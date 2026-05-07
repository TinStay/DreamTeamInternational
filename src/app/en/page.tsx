import type { Metadata } from "next";
import { HomePage } from "@/app/home-page";

export const metadata: Metadata = {
  title: "DreamTeam | AI Video Production",
  description:
    "DreamTeam creates high-impact AI video for brands worldwide — photoreal, stylized, or hybrid. Scripting, production, and fast turnaround.",
  alternates: {
    canonical: "/en",
    languages: {
      en: "/en",
      bg: "/bg",
    },
  },
};

export default function EnHomePage() {
  return <HomePage />;
}
