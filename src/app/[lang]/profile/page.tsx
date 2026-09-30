import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfilePageView } from "@/components/profile-page-view";
import { LOCALES, isLocale, getDictionary } from "@/lib/i18n/config";
import { requireAccount } from "@/lib/supabase/account-page";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  // A private page: out of the search index.
  return { title: getDictionary(lang).account.profileMetaTitle, robots: { index: false, follow: false } };
}

/** `/profile` - View profile. Signed-out visitors go to the home page. */
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const info = await requireAccount(lang);
  return <ProfilePageView info={info} />;
}
