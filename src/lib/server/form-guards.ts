/**
 * Shared request hygiene for the form API routes (`/api/contact`, `/api/quote`).
 * Everything here is isomorphic-safe except `createRateLimiter`/`clientIp`,
 * which only make sense server-side.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trim, coerce to string, strip control chars (header injection), cap length. */
export function clean(value: unknown, max: number): string {
  return typeof value === "string"
    ? value.replace(/[\r\n\t\0]+/g, " ").trim().slice(0, max)
    : "";
}

/** Like `clean` but preserves newlines — for multi-line free-text fields. */
export function cleanMultiline(value: unknown, max: number): string {
  return typeof value === "string"
    ? value.replace(/[\0]/g, "").trim().slice(0, max)
    : "";
}

export function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Best-effort client IP (Vercel sets x-forwarded-for; spoofable when self-hosted). */
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Best-effort in-memory rate limiter. Resets on cold start and is
 * per-instance, so it only blunts bursts from a single source — not a
 * substitute for a distributed limiter, but enough to slow trivial form spam.
 * Each route creates its own limiter so budgets stay per-endpoint.
 */
export function createRateLimiter(windowMs: number, max: number) {
  const recentHits = new Map<string, number[]>();
  return function isRateLimited(ip: string, now: number): boolean {
    const windowStart = now - windowMs;
    // Forget sources that have gone quiet, so a long-lived instance cannot grow the map without end.
    if (recentHits.size > 5000) {
      for (const [key, ticks] of recentHits) if (!ticks.some((tick) => tick > windowStart)) recentHits.delete(key);
    }
    const hits = (recentHits.get(ip) ?? []).filter((tick) => tick > windowStart);
    hits.push(now);
    recentHits.set(ip, hits);
    return hits.length > max;
  };
}

/**
 * Whether a state-changing request comes from another site (CSRF). A browser always sends `Origin` on a cross-origin
 * POST and `Sec-Fetch-Site` on modern engines; a request from our own pages carries our origin. A request with neither
 * (a server-to-server call, curl) is not a browser riding the visitor's cookies, so it is let through - it still needs
 * the session cookie to do anything.
 */
export function isCrossSite(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin !== new URL(req.url).origin;
    } catch {
      return true;
    }
  }
  const site = req.headers.get("sec-fetch-site");
  return site !== null && site !== "same-origin" && site !== "none";
}
