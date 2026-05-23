import type { Metadata } from "next";
import { en } from "@/lib/i18n/en";
import { ContactProcessLayout } from "@/components/contact-process-layout";
import { localeAlternates } from "@/lib/routes";

export const metadata: Metadata = {
  title: en.contactPage.metaTitle,
  description: en.contactPage.metaDescription,
  alternates: {
    canonical: "/en/contact",
    languages: localeAlternates("/contact"),
  },
};

export default function EnContactPage() {
  return <ContactProcessLayout />;
}
