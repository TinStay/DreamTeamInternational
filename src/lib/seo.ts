import type { Language } from "@/lib/i18n/config";

/*
 * SEO constants and the small helpers server and client code share: the
 * canonical origin every absolute URL is built on (canonicals, hreflang,
 * JSON-LD ids, the sitemap), the Open Graph locales, and the JSON-LD
 * serialiser. The builders that pull in the dictionaries and the project
 * data (the organization graph, the case-study graph, the lists) live in
 * `seo-graph.ts`, server-side only, so a client component that only needs a
 * breadcrumb list does not drag the whole catalogue into its bundle.
 */

export const SITE_URL = "https://dreamteam.video";
/** The one `@id` every page's JSON-LD points its publisher / provider at. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
/** The branded share image (`app/opengraph-image.tsx`), also the organization's `image`. */
export const OG_IMAGE_PATH = "/opengraph-image";

export function absoluteUrl(path = "") {
  return `${SITE_URL}${path}`;
}

/** Open Graph locale per site language. */
export const OG_LOCALE: Record<Language, string> = { bg: "bg_BG", en: "en_US" };

/**
 * The `dangerouslySetInnerHTML` value for a JSON-LD `<script>`: `<` is escaped so no content (a client's name, a
 * headline) can ever close the script early.
 */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

/** A `BreadcrumbList` for the crumbs of the current page - `url` absolute. */
export function breadcrumbList(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * A page's Open Graph block in full: a page that sets `openGraph` at all replaces the layout's whole block (Next
 * does not deep-merge it), so the site name, the locale and the share image must come along with the title.
 */
export function openGraphFor(
  lang: Language,
  page: { title: string; description: string; path: string; image?: { url: string; width: number; height: number; alt: string } }
) {
  return {
    type: "website" as const,
    siteName: "DreamTeam",
    locale: OG_LOCALE[lang],
    alternateLocale: [OG_LOCALE[lang === "bg" ? "en" : "bg"]],
    title: page.title,
    description: page.description,
    url: absoluteUrl(page.path),
    images: [page.image ?? { url: OG_IMAGE_PATH, width: 1200, height: 630, alt: "DreamTeam — AI Video Production" }],
  };
}
