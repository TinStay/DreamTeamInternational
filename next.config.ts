import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow quality={100} usages (flags, service icons) without dev warnings.
    qualities: [75, 100],
    // YouTube thumbnails for the home-page portfolio teaser marquee.
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" }],
  },
  async redirects() {
    return [
      // The bare domain: where the visitor is picks the locale. A Bulgarian-first Accept-Language goes to /bg wherever
      // they are; otherwise Vercel's geolocation header decides (`x-vercel-ip-country`, the two-letter code the CDN sets
      // on every deployed request - never in `next dev`, where a curl with the header exercises the branches): Bulgaria
      // → /bg, any other country → /en; and with no geolocation at all (local dev, a proxy that strips it, a code the CDN
      // could not resolve) the default is /bg, the primary locale - the client sits in Bulgaria behind an English-first
      // browser and landed on /en while the language alone decided. Temporary on purpose, as Google asks of language
      // redirects, so no cache ever pins one choice for everyone; the locale pages themselves are what gets indexed
      // (x-default stays /en: a searcher in neither language is better served in English).
      { source: "/", has: [{ type: "header", key: "accept-language", value: "[bB][gG].*" }], destination: "/bg", permanent: false },
      { source: "/", has: [{ type: "header", key: "x-vercel-ip-country", value: "[bB][gG]" }], destination: "/bg", permanent: false },
      { source: "/", has: [{ type: "header", key: "x-vercel-ip-country", value: "[A-Za-z]{2}" }], destination: "/en", permanent: false },
      { source: "/", destination: "/bg", permanent: false },
      { source: "/privacy", destination: "/en/privacy", permanent: true },
      { source: "/terms", destination: "/en/terms", permanent: true },
      { source: "/training", destination: "/bg/training", permanent: true },
      { source: "/individual", destination: "/bg/training/individual", permanent: true },
      { source: "/en/individual", destination: "/en/training/individual", permanent: true },
      { source: "/bg/individual", destination: "/bg/training/individual", permanent: true },
      // Retired Chinese locale → English (replaces the old /zh middleware redirect).
      { source: "/zh", destination: "/en", permanent: true },
      { source: "/zh/:path*", destination: "/en/:path*", permanent: true },
    ];
  },
  async headers() {
    // Baseline security headers. A Content-Security-Policy is intentionally
    // omitted — it needs an allowlist for PostHog, Vercel Analytics, YouTube
    // embeds, Google Fonts, and styled-components, so add it separately with
    // proper testing.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
