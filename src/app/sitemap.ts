import type { MetadataRoute } from "next";
import { LOCALES, getDictionary, type Language } from "@/lib/i18n/config";
import { youtubeThumbnailUrl } from "@/lib/portfolio-highlights";
import { PROJECTS } from "@/lib/projects";
import { SITE_URL } from "@/lib/seo";
import { SERVICE_SLUGS } from "@/lib/services/constants";

/*
 * Every indexable page in both locales, each with its hreflang set
 * (`bg`, `en` and `x-default` - the English page, where `/` sends a visitor
 * whose browser is not Bulgarian), and a video entry on each case study
 * whose film is on YouTube (title, poster, embed), so Google's video index
 * knows the films are ours. The service pages were missing here for a
 * while - the list is built from the same slug catalogues the routes use.
 */

/** Path suffixes (relative to a locale root) that should be indexed. */
const PATHS: readonly string[] = [
  "",
  "/services",
  ...SERVICE_SLUGS.map((slug) => `/services/${slug}`),
  "/projects",
  ...PROJECTS.map((project) => `/projects/${project.id}`),
  "/portfolio",
  "/training",
  "/training/individual",
  // Skool training temporarily hidden.
  // "/training/skool",
  "/training/team",
  "/contact",
  "/privacy",
  "/terms",
];

function priorityFor(path: string) {
  if (path === "") return 1;
  if (path.startsWith("/services") || path.startsWith("/projects")) return 0.9;
  if (path === "/portfolio" || path.startsWith("/training")) return 0.8;
  if (path === "/contact") return 0.7;
  return 0.4;
}

/** The case study's film for the video sitemap - only the ones on YouTube (Bunny posters are referer-gated). */
function videosFor(path: string, lang: Language) {
  const project = PROJECTS.find((candidate) => path === `/projects/${candidate.id}` && candidate.videoId);
  if (!project?.videoId) return undefined;
  const item = getDictionary(lang).projects.items[project.id];
  return [
    {
      title: `${item.name} — ${item.headline}`,
      description: item.description,
      thumbnail_loc: youtubeThumbnailUrl(project.videoId),
      player_loc: `https://www.youtube.com/embed/${project.videoId}`,
      family_friendly: "yes" as const,
      requires_subscription: "no" as const,
      live: "no" as const,
      ...(project.published ? { publication_date: project.published } : {}),
    },
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return LOCALES.flatMap((lang) =>
    PATHS.map((path) => ({
      url: `${SITE_URL}/${lang}${path}`,
      lastModified,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: priorityFor(path),
      alternates: {
        languages: {
          en: `${SITE_URL}/en${path}`,
          bg: `${SITE_URL}/bg${path}`,
          "x-default": `${SITE_URL}/en${path}`,
        },
      },
      videos: videosFor(path, lang),
    }))
  );
}
