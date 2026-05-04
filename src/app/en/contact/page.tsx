import type { Metadata } from "next";
import { en } from "@/lib/i18n/en";
import { ContactProcessLayout } from "@/components/contact-process-layout";

export const metadata: Metadata = {
  title: en.contactPage.metaTitle,
  description: en.contactPage.metaDescription,
  alternates: {
    canonical: "/en/contact",
    languages: {
      en: "/en/contact",
      bg: "/bg/contact",
    },
  },
};

export default function EnContactPage() {
  return <ContactProcessLayout />;
}
