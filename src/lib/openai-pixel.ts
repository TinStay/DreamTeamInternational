/**
 * OpenAI conversion pixel (`oaiq`) — the loader snippet lives in
 * `components/consent/tracking-scripts.tsx`, mounted only with marketing
 * consent; it stubs `window.oaiq` with a command queue, so events fired before
 * the SDK finishes downloading are replayed once it lands.
 *
 * Every call is best-effort: the pixel is third-party and may be missing
 * entirely (no consent, ad blockers, SSR, tests), so a failure here must never
 * take a form submission down with it - without consent `window.oaiq` is simply
 * absent and the conversion is not reported.
 */

declare global {
  interface Window {
    oaiq?: (...args: unknown[]) => void;
  }
}

/**
 * Fire the `lead_created` conversion. Call it only after the server confirms
 * the submission — a conversion is a completed lead, not an attempted one.
 */
export function trackLeadCreated(): void {
  if (typeof window === "undefined" || typeof window.oaiq !== "function") return;
  try {
    window.oaiq("measure", "lead_created", { type: "customer_action" });
  } catch {
    // Never let analytics break the form.
  }
}
