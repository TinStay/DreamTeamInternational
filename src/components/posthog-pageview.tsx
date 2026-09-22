"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { useConsent } from "@/lib/consent";
import { startPostHog } from "./posthog-provider";

/** A `$pageview` per App Router navigation - only with analytics consent (`startPostHog` is a no-op once running). */
export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();
  const consent = useConsent();
  const analytics = consent?.analytics === true;

  useEffect(() => {
    if (!analytics || !pathname || !startPostHog()) return;
    let url = window.location.origin + pathname;
    const search = searchParams.toString();
    if (search) {
      url += "?" + search;
    }
    posthog.capture("$pageview", { $current_url: url });
  }, [analytics, pathname, searchParams, posthog]);

  return null;
}
