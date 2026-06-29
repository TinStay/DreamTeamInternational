import type { MetadataRoute } from "next";

const BASE_URL = "https://dreamteam.technology";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Don't index the API or internal demo routes.
      disallow: ["/api/", "/demo/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
