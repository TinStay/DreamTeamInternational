import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Terms and Conditions | DreamTeam",
  alternates: { canonical: "/en/terms" },
};

export default function TermsPage() {
  redirect("/en/terms");
}
