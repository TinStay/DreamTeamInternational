import { useSyncExternalStore } from "react";

/*
 * Cookie consent - the one place the site remembers what a visitor allowed.
 *
 * Nothing optional runs before a choice: the marketing tags
 * (`components/consent/tracking-scripts.tsx`) and PostHog
 * (`components/posthog-provider.tsx`) read `useConsent()` and stay off until
 * their category is granted - they are not in the server HTML at all. The
 * choice lives in a first-party cookie (`dt_consent`) for six months, the only
 * cookie the site sets itself and a "necessary" one under ePrivacy, and it is
 * versioned: bump `CONSENT_VERSION` when a category's meaning or the vendors
 * behind it change, and every visitor is asked again.
 */

export const CONSENT_COOKIE = "dt_consent";
export const CONSENT_VERSION = 1;
/** Six months, then the banner asks again (the EDPB / CNIL guidance for how long a choice may be remembered). */
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 182;
/** Dispatched on `window` to reopen the banner on its settings (the footer's "Cookie settings"). */
export const CONSENT_OPEN_EVENT = "dt-consent:open";

export type ConsentCategory = "analytics" | "marketing";
export type ConsentChoice = Record<ConsentCategory, boolean>;
export type Consent = ConsentChoice & { version: number; at: string };

export const NO_OPTIONAL: ConsentChoice = { analytics: false, marketing: false };
export const ALL_OPTIONAL: ConsentChoice = { analytics: true, marketing: true };

/** The cookie value: `{"v":1,"a":1,"m":0,"t":"2026-09-22T10:00:00.000Z"}`, URL-encoded. */
export function serializeConsent(consent: Consent): string {
  return encodeURIComponent(
    JSON.stringify({ v: consent.version, a: consent.analytics ? 1 : 0, m: consent.marketing ? 1 : 0, t: consent.at })
  );
}

/** `null` for anything that is not a current, well-formed choice - the banner then asks. */
export function parseConsent(raw: string | null | undefined): Consent | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(decodeURIComponent(raw)) as Partial<Record<"v" | "a" | "m" | "t", unknown>>;
    if (data.v !== CONSENT_VERSION || typeof data.t !== "string") return null;
    return { version: CONSENT_VERSION, analytics: data.a === 1, marketing: data.m === 1, at: data.t };
  } catch {
    return null;
  }
}

function cookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(prefix)) return part.slice(prefix.length);
  }
  return null;
}

/** The stored choice, or `null` when there is none (or it is from an older `CONSENT_VERSION`). */
export function readConsent(): Consent | null {
  return parseConsent(cookieValue(CONSENT_COOKIE));
}

const listeners = new Set<() => void>();

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Stores the choice and tells every `useConsent()` - the gated scripts mount on the spot, no reload. */
export function writeConsent(choice: ConsentChoice): Consent {
  const consent: Consent = { ...choice, version: CONSENT_VERSION, at: new Date().toISOString() };
  // `Secure` only over https - a browser drops it on plain http (next dev).
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(consent)}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  for (const listener of listeners) listener();
  return consent;
}

// `useSyncExternalStore` wants the same object back while nothing changed, so the parse is cached on the raw value.
let snapshotRaw: string | null | undefined;
let snapshot: Consent | null = null;
function getSnapshot(): Consent | null {
  const raw = cookieValue(CONSENT_COOKIE);
  if (raw !== snapshotRaw) {
    snapshotRaw = raw;
    snapshot = parseConsent(raw);
  }
  return snapshot;
}
const getServerSnapshot = () => undefined;

/**
 * The visitor's choice: `undefined` on the server and while hydrating (unknown - render nothing that depends on
 * it), `null` when they have not chosen yet (the banner shows), otherwise the choice. Same pattern as
 * `useMediaQuery` - no effect + setState, no hydration mismatch.
 */
export function useConsent(): Consent | null | undefined {
  return useSyncExternalStore(subscribeConsent, getSnapshot, getServerSnapshot);
}

/** Reopen the banner on its settings, with the stored choice ticked. */
export function openConsentSettings(): void {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

/** True when `next` takes away a category `previous` had granted - the page then reloads, so the vendor's script is gone for good. */
export function withdrawn(previous: Consent | null, next: ConsentChoice): boolean {
  if (!previous) return false;
  return (previous.analytics && !next.analytics) || (previous.marketing && !next.marketing);
}

/** What each category's vendors store, by key prefix: PostHog (`ph_…`); the Google tag (`_gcl_…`, `_ga…`) and the OpenAI pixel (`__obref`, `oaiq_…`). */
const VENDOR_PREFIXES: Record<ConsentCategory, string[]> = {
  analytics: ["ph_"],
  marketing: ["_gcl", "_ga", "_gid", "__obref", "oaiq"],
};

export const OPTIONAL_CATEGORIES: ConsentCategory[] = ["analytics", "marketing"];

/** The categories a choice leaves out - their vendors' storage is purged on every choice, so nothing from an earlier, since expired consent lingers. */
export function deniedCategories(choice: ConsentChoice): ConsentCategory[] {
  return OPTIONAL_CATEGORIES.filter((category) => !choice[category]);
}

/**
 * Deletes the given categories' vendor cookies and browser storage. A cookie is deleted with the attributes it
 * was set with, so every domain a tag may have used is tried (the Google tag sets `_gcl_au` on the registrable
 * domain, `dreamteamvideo.com`, not the `www` host). The site's own entries (`dt_consent`, `app-lang`, `theme`) stay.
 */
export function purgeVendorStorage(categories: ConsentCategory[] = OPTIONAL_CATEGORIES): void {
  if (typeof document === "undefined") return;
  const prefixes = categories.flatMap((category) => VENDOR_PREFIXES[category]);
  const isVendorKey = (key: string) => prefixes.some((prefix) => key.startsWith(prefix));
  const names = document.cookie
    .split("; ")
    .map((part) => part.split("=")[0] ?? "")
    .filter(isVendorKey);
  const parts = location.hostname.split(".");
  const domains = [""]; // no `Domain` = the host-only cookie
  for (let i = 0; i < parts.length - 1; i++) domains.push(parts.slice(i).join("."));
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ""}`;
    }
  }
  for (const store of [localStorage, sessionStorage]) {
    try {
      for (const key of Object.keys(store)) if (isVendorKey(key)) store.removeItem(key);
    } catch {
      // Storage can be blocked (private mode, a strict policy) - there is nothing to purge then.
    }
  }
}
