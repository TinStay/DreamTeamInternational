import { notFound, redirect } from "next/navigation";
import { LOCALES, isLocale } from "@/lib/i18n/config";
import { accountPath } from "@/lib/routes";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}
export const dynamicParams = false;

/** `/profile` - merged into Account & subscription; old links land there. */
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  redirect(accountPath(lang));
}
