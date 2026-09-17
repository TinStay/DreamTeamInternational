import type { ShowcaseProjectKey } from "@/lib/projects";

/**
 * Each brand world's display face - a `--font-*` from `layout.tsx` with its
 * weight / style / tracking - worn by the home showcase's headline and by the
 * large letters of the project's own page (the hero title, the section
 * titles, the CTA). The class strings are complete overrides for the site's
 * heading face (`font-heading`), so they go AFTER it in a `cn()`.
 */
export const PROJECT_DISPLAY_FONT: Record<ShowcaseProjectKey, string> = {
  // Corporate: Montserrat, the face of the giant word behind Roni.
  boleron: "font-[family-name:var(--font-montserrat)] font-bold tracking-tight",
  // The reference animation's Emblema face: Playfair Display, italic, sentence case.
  emblema: "font-[family-name:var(--font-playfair)] font-medium normal-case italic tracking-normal",
  // The platform's own face (mymindguard.ai, and its page's titles): Space Grotesk - no Cyrillic, so Manrope
  // stands in for the Bulgarian glyphs, as on the page.
  mindguard: "font-[family-name:var(--font-space-grotesk),var(--font-manrope)] font-bold tracking-[-0.02em]",
  // Tech: Exo 2, uppercase.
  plasico: "font-[family-name:var(--font-exo)] font-bold uppercase tracking-tight",
  // The face of the client's case study: Manrope, semibold, a touch tight (its h1 / h2).
  osmo: "font-[family-name:var(--font-manrope)] font-semibold tracking-[-0.02em]",
};
