import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Privacy Policy | DreamTeam Technology",
  alternates: { canonical: "/en/privacy" },
};

export default function PrivacyPage() {
  redirect("/en/privacy");
}
