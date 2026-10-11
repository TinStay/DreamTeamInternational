import { notFound, redirect } from "next/navigation";
import { LOCALES, isLocale } from "@/lib/i18n/config";
import { adminPath } from "@/lib/routes";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}
export const dynamicParams = false;

/** `/team` moved to `/admin` (the admin dashboard): old links and emails keep working, query included (`?project=`). */
export default async function TeamRedirect({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) if (typeof value === "string") query.set(key, value);
  const q = query.toString();
  redirect(`${adminPath(lang)}${q ? `?${q}` : ""}`);
}
