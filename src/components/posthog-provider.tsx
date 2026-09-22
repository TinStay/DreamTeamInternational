"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { useConsent } from "@/lib/consent";

/*
 * PostHog runs only with analytics consent (`useConsent`): `init` - and with
 * it the remote config, the session recorder and the `ph_…` cookie - waits for
 * the visitor's "yes", and a stored choice starts it on the first client
 * render. Nothing is captured before that. `startPostHog` is idempotent, so the
 * page-view hook calls it too (a child's effect runs before its parent's, and
 * the first page view after "Accept" must not be lost); a withdrawal reloads
 * the page (see the consent banner), the only way to stop a loaded SDK for good.
 */

/** Initialises PostHog once; false when the key is not configured. */
export function startPostHog(): boolean {
  if (posthog.__loaded) return true;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return false;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    ui_host: "https://eu.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false, // We capture manually using PostHogPageView
    capture_pageleave: true,
    // No scroll-depth properties: their listener reads the document's scroll height on every scroll event, which
    // forces a layout in the middle of the scroll-linked animations (it was the single hottest thing on a phone).
    disable_scroll_properties: true,
  });
  return true;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const consent = useConsent();
  const analytics = consent?.analytics === true;

  useEffect(() => {
    if (analytics) startPostHog();
  }, [analytics]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
