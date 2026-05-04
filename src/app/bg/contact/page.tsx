import type { Metadata } from "next";
import { bg } from "@/lib/i18n/bg";
import { ContactProcessLayout } from "@/components/contact-process-layout";

export const metadata: Metadata = {
  title: bg.contactPage.metaTitle,
  description: bg.contactPage.metaDescription,
  alternates: {
    canonical: "/bg/contact",
    languages: {
      en: "/en/contact",
      bg: "/bg/contact",
    },
  },
};

export default function BgContactPage() {
  return <ContactProcessLayout />;
}
