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
