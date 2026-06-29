import type { MetadataRoute } from "next";

const BASE_URL = "https://dreamteam.video";

// AI assistants / answer engines we explicitly welcome to crawl and cite the
// site, so DreamTeam can surface in tools like ChatGPT, Claude, Gemini, and
// Perplexity. (Googlebot / Bingbot are covered by the "*" rule below.)
const AI_CRAWLERS = [
  // OpenAI (ChatGPT)
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic (Claude)
  "ClaudeBot",
  "Claude-Web",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  // Google (Gemini / AI Overviews)
  "Google-Extended",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Apple Intelligence
  "Applebot",
  "Applebot-Extended",
  // Others that feed LLMs / answer engines
  "Amazonbot",
  "Meta-ExternalAgent",
  "FacebookBot",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "DuckAssistBot",
  "YouBot",
];

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/", "/demo/"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // Explicitly allow AI crawlers (same access as everyone else).
      { userAgent: AI_CRAWLERS, allow: "/", disallow },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
