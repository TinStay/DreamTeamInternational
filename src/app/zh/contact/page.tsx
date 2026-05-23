import type { Metadata } from "next";
import { zh } from "@/lib/i18n/zh";
import { ContactProcessLayout } from "@/components/contact-process-layout";
import { localeAlternates } from "@/lib/routes";

export const metadata: Metadata = {
  title: zh.contactPage.metaTitle,
  description: zh.contactPage.metaDescription,
  alternates: {
    canonical: "/zh/contact",
    languages: localeAlternates("/contact"),
  },
};

export default function ZhContactPage() {
  return <ContactProcessLayout />;
}
