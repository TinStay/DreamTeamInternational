import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n/config";

const BASE_URL = "https://dreamteam.video";

/** Path suffixes (relative to a locale root) that should be indexed. */
const PATHS = [
  "",
  "/contact",
  "/training",
  "/training/individual",
  // Skool training temporarily hidden.
  // "/training/skool",
  "/training/team",
  "/privacy",
  "/terms",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return LOCALES.flatMap((lang) =>
    PATHS.map((path) => ({
      url: `${BASE_URL}/${lang}${path}`,
      lastModified,
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1 : path.startsWith("/training") ? 0.8 : 0.6,
      alternates: {
        languages: {
          en: `${BASE_URL}/en${path}`,
          bg: `${BASE_URL}/bg${path}`,
        },
      },
    }))
  );
}
