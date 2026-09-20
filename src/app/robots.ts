import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/*
 * Everyone may crawl everything but the API. The AI assistants / answer
 * engines are named as well, so their access is explicit and cannot be
 * lost to a copied blanket rule later: the convention is one plain bot per
 * operator for training, a "SearchBot" for its search index and a "User"
 * agent for live fetches on a person's behalf - all welcome, so DreamTeam
 * can be found and cited in ChatGPT, Claude, Gemini, Perplexity, Copilot,
 * Meta AI, Apple Intelligence, Mistral and the rest. (Googlebot / Bingbot
 * fall under the "*" rule; `Google-Extended` / `Applebot-Extended` are
 * control tokens for Gemini / Apple Intelligence, never seen in logs.)
 */
const AI_CRAWLERS = [
  // OpenAI (ChatGPT): training, the search index, live browsing
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic (Claude)
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "Claude-Web",
  "anthropic-ai",
  // Google (Gemini / AI Overviews)
  "Google-Extended",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Microsoft Copilot rides Bing's index (Bingbot, under "*")
  // Apple Intelligence
  "Applebot",
  "Applebot-Extended",
  // Meta AI
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "FacebookBot",
  // Mistral
  "MistralAI-User",
  // Amazon (Alexa / Rufus)
  "Amazonbot",
  // DuckDuckGo AI answers, You.com
  "DuckAssistBot",
  "YouBot",
  // Open data sets and other model builders
  "CCBot",
  "cohere-ai",
  "AI2Bot",
  "Diffbot",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // Explicitly allow AI crawlers (same access as everyone else).
      { userAgent: AI_CRAWLERS, allow: "/", disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
