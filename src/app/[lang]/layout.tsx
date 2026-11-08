import type { Metadata } from "next";
// The faces are self-hosted from the @fontsource packages (their CSS carries the unicode-range subsets, Cyrillic
// included), never fetched from Google at build time: next/font/google broke the Vercel build once Google began
// answering with `/l/font?kit=…&skey=…` URLs, whose query it cannot parse. The `--font-*` names are set in globals.css.
import "@fontsource-variable/exo-2/wght.css";
import "@fontsource-variable/exo-2/wght-italic.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/500-italic.css";
import "@fontsource/playfair-display/600-italic.css";
import "@fontsource-variable/manrope/wght.css";
import "@fontsource-variable/space-grotesk/wght.css";
import "@fontsource-variable/dm-sans/wght.css";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/inter/wght.css";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SmoothScroll } from "@/components/smooth-scroll";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { LOCALES, getDictionary, isLocale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/routes";
import { OG_IMAGE_PATH, OG_LOCALE, SITE_URL, jsonLd } from "@/lib/seo";
import { organizationGraph } from "@/lib/seo-graph";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "@/components/posthog-provider";
import { PostHogPageView } from "@/components/posthog-pageview";
import { PromoBar } from "@/components/promo-bar";
import { ConsentBanner } from "@/components/consent/consent-banner";
import { TrackingScripts } from "@/components/consent/tracking-scripts";
import { Suspense } from "react";

/*
 * The root layout lives under the locale segment, so `<html lang>` is the
 * page's real language (`/en` used to ship `lang="bg"` and only a client
 * effect corrected it - crawlers that do not run scripts saw Bulgarian). The
 * bare `/` is a redirect in `next.config.ts` (the visitor's language picks
 * the locale), so nothing needs a layout above this one; the metadata
 * routes (`sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, `llms.txt`) and
 * the API live beside it without one.
 */

/**
 * Fonts are self-hosted from @fontsource (no request to Google at build or run time), so they
 * can't fail to load behind a CSS `@import`. Cyrillic subsets are required —
 * the site is Bulgarian-first. Exo 2 (headings and body alike) is variable
 * (100–900), so no `weight`; the display faces that ship static files list
 * the weights they are used at.
 */

/**
 * The projects showcase's display faces - one per brand world (`showcase-scenes.tsx`, `headline`), all with
 * Cyrillic: Montserrat (the giant "Boleron" word, the face the reference animation uses, and Boleron's corporate
 * headline), Playfair Display (Emblema, as in the reference), Exo 2 (Plasico's tech), Manrope (OSMO - the face of
 * the client's case study, its page's body too), and MindGuard's headline in the platform's own face. MindGuard's
 * page runs in the platform's faces from mymindguard.ai - Space Grotesk for the headings (the showcase headline
 * too), DM Sans for the body; neither has Cyrillic, so Manrope follows them in the stack and stands in for the
 * Bulgarian glyphs.
 */
// Unknown locales 404 here, before any page.
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * The site-wide defaults every page inherits: the share image, the Open Graph locale, the robots directives
 * (`max-snippet` / `max-image-preview` unrestricted, so answer engines and AI Overviews may quote freely) and the
 * hreflang set. No canonical here - each page states its own - and no Open Graph title / description either, so a
 * page's own title and description flow into its `og:` tags (a layout-level pair used to override them all).
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : "en";
  const t = getDictionary(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: t.seo.home.title,
    description: t.seo.home.description,
    applicationName: "Keplerbay",
    alternates: { languages: localeAlternates() },
    openGraph: {
      type: "website",
      siteName: "Keplerbay",
      locale: OG_LOCALE[locale],
      images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: "Keplerbay — AI Video Production" }],
    },
    twitter: { card: "summary_large_image" },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    icons: {
      icon: "/logo/logo_short_black.png",
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : "en";
  // The English site is dark only, over a deep 3D space (`html.site-deep` in globals.css); /bg starts dark and keeps the
  // visitor's choice.
  const deep = locale === "en";
  return (
    // `class="dark"` is rendered server-side so the FIRST paint is already dark —
    // without it the light `:root` palette flashes until next-themes' script runs.
    // next-themes reconciles this client-side if the visitor picked light
    // (suppressHydrationWarning covers that swap).
    // The font variables are defined on `:root` in globals.css.
    <html
      lang={locale}
      className={`dark${deep ? " site-deep" : ""}`}
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased relative min-h-screen" suppressHydrationWarning>
        {/* Organization + website structured data (`lib/seo-graph.ts`), in the page's language. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(organizationGraph(locale))} />
        {/*
          The marketing tags - the Google tag (Ads) and the OpenAI conversion pixel -
          mount only with the visitor's marketing consent (`lib/consent.ts`); PostHog
          likewise waits for analytics consent inside its provider. Vercel Analytics
          is cookieless and stays ungated.
        */}
        <TrackingScripts />
        <PostHogProvider>
          <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              // The English site has one theme - dark, over the deep space (its header has no theme toggle); /bg keeps
              // the visitor's choice.
              forcedTheme={deep ? "dark" : undefined}
              enableSystem={false}
              disableTransitionOnChange={false}
            >
              <LanguageProvider>
                <SmoothScroll />
                <Suspense fallback={null}>
                  <PostHogPageView />
                </Suspense>
                {deep ? <PromoBar /> : null}
                <div className="relative z-10">
                  {children}
                </div>
                <ConsentBanner />
              </LanguageProvider>
            </ThemeProvider>
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
