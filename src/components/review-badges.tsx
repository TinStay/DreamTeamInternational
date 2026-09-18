"use client";

import { useCallback, useEffect, useRef } from "react";
import Script from "next/script";
import { IconStarFilled } from "@tabler/icons-react";
import { CLUTCH, GOOGLE_REVIEWS } from "@/lib/contact-info";
import { cn } from "@/lib/utils";

/*
 * The two review badges the footer shows: DreamTeam's Google rating (the
 * place's own numbers, kept by hand in `lib/contact-info.ts` - there is no
 * key-less way to read them live) linking to the reviews on Google, and the
 * official Clutch widget (their `widget.js` fills a `.clutch-widget` div with
 * an iframe; it scans the page once when it loads, so a footer mounted later
 * by a client-side navigation asks it to scan again).
 */

declare global {
  interface Window {
    CLUTCHCO?: { loaded: boolean; Init: () => void; Destroy: () => void };
  }
}

/** Google's "G" mark. */
function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** DreamTeam's Google rating: the G, the stars, the rating and the count, linking to the reviews. */
export function GoogleReviewsBadge({ label, className }: { label: string; className?: string }) {
  const { rating, count, reviewsUrl } = GOOGLE_REVIEWS;
  return (
    <a
      href={reviewsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group inline-flex items-center gap-3 rounded-2xl border border-card-border bg-card px-3.5 py-2.5 shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-12px_rgba(2,6,23,0.35)]",
        className
      )}
      aria-label={`Google: ${rating} / 5 · ${count} ${label}`}
    >
      <GoogleG className="size-8 shrink-0" />
      <span className="flex flex-col gap-0.5 text-left">
        <span className="flex items-center gap-1.5">
          <span className="font-heading text-lg font-bold leading-none text-foreground">{rating.toFixed(1)}</span>
          <span className="flex items-center gap-px text-[#FBBC04]" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <IconStarFilled key={i} className="size-3.5" />
            ))}
          </span>
        </span>
        <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">
          {count} {label}
        </span>
      </span>
    </a>
  );
}

/**
 * The official Clutch badge (their widget, type 2 - "Reviewed on Clutch" with the rating): one container per theme,
 * the dark one on the widget's `darkbg` variant (white type, no card), toggled with `dark:`.
 */
export function ClutchBadge({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // Only once the widget script is here and while this container is still empty (Init injects the iframe; the
  // script's own readystatechange hook never fires for a lazily loaded script on a finished document).
  const init = useCallback(() => {
    if (typeof window.CLUTCHCO?.Init === "function" && ref.current && !ref.current.querySelector("iframe")) window.CLUTCHCO.Init();
  }, []);
  // A footer mounted by a client-side navigation: the script has already scanned the page once.
  useEffect(() => {
    init();
  }, [init]);
  return (
    // The widget's iframe is `width: 100%` with its content left-aligned inside, so the container is sized to
    // that content (about 180px) - then whatever centres the container centres the badge.
    <div ref={ref} className={cn("min-h-[45px] w-[188px] max-w-full", className)}>
      <Script src="https://widget.clutch.co/static/js/widget.js" strategy="lazyOnload" onLoad={init} />
      <div
        className="clutch-widget dark:hidden"
        data-url="https://widget.clutch.co"
        data-widget-type="2"
        data-height="45"
        data-nofollow="false"
        data-expandifr="true"
        data-clutchcompany-id={CLUTCH.companyId}
      />
      {/* `color-scheme: light` on the container: the widget document is light, and Chrome paints an opaque white
          canvas behind an iframe whose colour scheme differs from its embedder's (the site is dark here). */}
      <div
        className="clutch-widget hidden [color-scheme:light] dark:block"
        data-url="https://widget.clutch.co"
        data-widget-type="2"
        data-height="45"
        data-nofollow="false"
        data-expandifr="true"
        data-darkbg="1"
        data-clutchcompany-id={CLUTCH.companyId}
      />
    </div>
  );
}
