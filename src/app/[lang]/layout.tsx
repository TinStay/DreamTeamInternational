import type { Metadata } from "next";
import { DM_Sans, Exo_2, Manrope, Montserrat, Playfair_Display, Space_Grotesk } from "next/font/google";
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
import { Suspense } from "react";
import Script from "next/script";

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
 * Fonts are self-hosted by `next/font` (no runtime request to Google), so they
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
const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});
/**
 * Exo 2 - the site's one face: headings (`font-heading`) and body / UI (`font-sans`) alike, and Plasico's showcase
 * headline. A variable font (100–900 + italic), so no weight list; `globals.css` maps both tokens to it.
 */
const exo = Exo_2({
  subsets: ["latin", "latin-ext", "cyrillic"],
  style: ["normal", "italic"],
  variable: "--font-exo",
  display: "swap",
});
// A variable font (200–800), so no weight list: OSMO's page runs its body at 400 and its titles at 600.
const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});
// The platform's faces (mymindguard.ai), Latin only - variable fonts, no weight list.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

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
  const locale = isLocale(lang) ? lang : "bg";
  const t = getDictionary(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: t.seo.home.title,
    description: t.seo.home.description,
    applicationName: "DreamTeam",
    alternates: { languages: localeAlternates() },
    openGraph: {
      type: "website",
      siteName: "DreamTeam",
      locale: OG_LOCALE[locale],
      alternateLocale: [OG_LOCALE[locale === "bg" ? "en" : "bg"]],
      images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: "DreamTeam — AI Video Production" }],
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
  const locale = isLocale(lang) ? lang : "bg";
  return (
    // `class="dark"` is rendered server-side so the FIRST paint is already dark —
    // without it the light `:root` palette flashes until next-themes' script runs.
    // next-themes reconciles this client-side if the visitor picked light
    // (suppressHydrationWarning covers that swap).
    // Font variables live on <html>: `--font-sans` / `--font-heading` are
    // resolved on `:root`, so the families must be defined there too.
    <html
      lang={locale}
      className={`dark ${exo.variable} ${montserrat.variable} ${playfair.variable} ${manrope.variable} ${spaceGrotesk.variable} ${dmSans.variable}`}
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased relative min-h-screen" suppressHydrationWarning>
        {/* Organization + website structured data (`lib/seo-graph.ts`), in the page's language. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(organizationGraph(locale))} />
        {/*
          OpenAI conversion pixel (oaiq). Vendor snippet kept verbatim: it stubs
          `window.oaiq` with a command queue, then injects the real SDK, so calls
          fired before the SDK lands are replayed. `afterInteractive` matches the
          vendor's plain <script> placement without blocking hydration.
        */}
        <Script id="openai-pixel" strategy="afterInteractive">
          {`!function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q;var j=d.createElement(s);j.async=1;j.src=u;var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(j,f)}(window,document,"script","https://bzrcdn.openai.com/sdk/oaiq.min.js");oaiq("init",{pixelId:"9vxEQCFdaKzy9yXADo8cMC",debug:true});`}
        </Script>
        <PostHogProvider>
          <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem={false}
              disableTransitionOnChange={false}
            >
              <LanguageProvider>
                <SmoothScroll />
                <Suspense fallback={null}>
                  <PostHogPageView />
                </Suspense>
                <div className="relative z-10">
                  {children}
                </div>
              </LanguageProvider>
            </ThemeProvider>
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
