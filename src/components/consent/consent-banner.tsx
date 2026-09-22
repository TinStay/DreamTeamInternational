"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { IconCookie, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ALL_OPTIONAL,
  CONSENT_OPEN_EVENT,
  NO_OPTIONAL,
  deniedCategories,
  purgeVendorStorage,
  readConsent,
  useConsent,
  withdrawn,
  writeConsent,
  type ConsentCategory,
  type ConsentChoice,
} from "@/lib/consent";
import { useLanguage } from "@/lib/i18n/language-context";
import { privacyPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

/*
 * The cookie banner: a small card in the bottom-right corner on desktop (above
 * the dock, full width, on phones) until the visitor chooses. Deliberately
 * tiny - one short line and two pills, the detail behind "Settings" - so it
 * never blocks the page; it does not steal focus on its own either. "Accept
 * all" and "Necessary only" are one click each and the same size, nothing
 * optional is pre-ticked, and "Settings" unfolds the three categories with
 * what each one stores. The footer's "Cookie settings" reopens it
 * (`CONSENT_OPEN_EVENT`) with the stored choice ticked; taking a category away
 * purges the vendor's storage and reloads, since a loaded tag cannot be unloaded.
 */

const OPTIONAL: ConsentCategory[] = ["analytics", "marketing"];
const PILL = "h-7 rounded-full px-3 text-[11px]";
const ROW = "rounded-lg bg-card-elevated px-2.5 py-1.5";

export function ConsentBanner() {
  const { t, language } = useLanguage();
  const copy = t.consent;
  const consent = useConsent();
  const [reopened, setReopened] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<ConsentChoice>(NO_OPTIONAL);
  const cardRef = useRef<HTMLElement>(null);
  const headingId = useId();

  // The footer's "Cookie settings": reopen on the settings with the stored choice ticked.
  useEffect(() => {
    const open = () => {
      const current = readConsent();
      setDraft({ analytics: current?.analytics ?? false, marketing: current?.marketing ?? false });
      setExpanded(true);
      setReopened(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, open);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open);
  }, []);

  // A reopened card takes focus (the visitor asked for it); the first prompt leaves focus where it was.
  useEffect(() => {
    if (reopened) cardRef.current?.focus();
  }, [reopened]);

  if (consent === undefined) return null; // the server and the hydrating render: the choice is unknown
  if (consent !== null && !reopened) return null;

  const close = () => {
    setReopened(false);
    setExpanded(false);
  };

  const decide = (choice: ConsentChoice) => {
    const previous = consent;
    writeConsent(choice);
    close();
    // Whatever is not granted has its vendors' storage cleared - stale entries from an earlier, expired consent
    // too; a category taken away also reloads, since a loaded tag cannot be unloaded.
    const denied = deniedCategories(choice);
    if (denied.length) purgeVendorStorage(denied);
    if (withdrawn(previous, choice)) window.location.reload();
  };

  return (
    <section
      ref={cardRef}
      tabIndex={-1}
      aria-labelledby={headingId}
      data-lenis-prevent
      onKeyDown={(event) => {
        if (event.key === "Escape" && reopened) close();
      }}
      className={cn(
        "fixed z-40 mx-auto max-h-[calc(100svh-7rem)] overflow-y-auto rounded-xl border border-card-border bg-card/95 p-3 text-card-foreground shadow-[0_18px_44px_-16px_rgba(2,6,23,0.45)] backdrop-blur-md outline-none",
        // Below lg the card is the mobile dock's own box - the same 96% / max-w-lg, centred - sitting just above it
        // (centred with `inset-x-0` + `mx-auto`, never `left-1/2` + a translate: the entrance animation writes
        // `transform` itself, so a translate-based centring is dropped for the length of it and the card slides in
        // half a width off). From lg it is a small card in the bottom-right corner.
        "inset-x-0 bottom-[calc(max(0.375rem,env(safe-area-inset-bottom))+5.25rem)] w-[96%] max-w-lg",
        "lg:inset-x-auto lg:right-5 lg:bottom-5 lg:mx-0 lg:w-auto lg:max-w-[20rem]",
        "animate-in fade-in slide-in-from-bottom-3 duration-300 motion-reduce:animate-none"
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--primary-gradient-start)] to-[var(--primary-gradient-end)] text-white"
          aria-hidden
        >
          <IconCookie className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="font-heading text-[13px] font-semibold">
            {copy.title}
          </h2>
          {/*
            "Settings" rides in the description as a link beside the policy, not as a row of its own - the card is
            a couple of lines shorter for it. What the law pins down is untouched: an equally easy refusal on the
            first layer (the two pills below, same size, nothing pre-ticked), the per-category consent one click
            away, the purposes named in the line itself and the policy linked.
          */}
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {copy.text}{" "}
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
              className="cursor-pointer text-primary underline-offset-2 hover:underline"
            >
              {copy.settings}
            </button>
            {" · "}
            <Link href={privacyPath(language)} className="text-primary underline-offset-2 hover:underline">
              {copy.privacy}
            </Link>
          </p>
        </div>
        {reopened ? (
          <button
            type="button"
            onClick={close}
            aria-label={copy.close}
            className="-mr-0.5 -mt-0.5 grid size-6 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-[color,background-color,transform] duration-200 ease-out hover:scale-110 hover:bg-muted hover:text-foreground"
          >
            <IconX className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>

      {expanded ? (
        <div className="mt-2.5 border-t border-card-border pt-2.5">
          <ul className="flex flex-col gap-1.5">
            <li className={ROW}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium">{copy.categories.necessary.name}</span>
                <span className="text-[11px] text-muted-foreground">{copy.categories.necessary.status}</span>
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{copy.categories.necessary.desc}</p>
              <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground/80">{copy.categories.necessary.cookies}</p>
            </li>
            {OPTIONAL.map((key) => (
              <li key={key} className={ROW}>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-xs">
                  <span className="font-medium">{copy.categories[key].name}</span>
                  <Checkbox
                    aria-label={copy.categories[key].name}
                    checked={draft[key]}
                    onCheckedChange={(checked) => setDraft((current) => ({ ...current, [key]: checked }))}
                  />
                </label>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{copy.categories[key].desc}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground/80">{copy.categories[key].cookies}</p>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground/80">{copy.embeds}</p>
        </div>
      ) : null}

      {/* The two choices share the card's full width - "Necessary only" left and the primary "Accept all" right -
          and "Save choices" takes a row of its own while the categories are open. */}
      <div className="mt-2.5 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" className={cn(PILL, "flex-1")} onClick={() => decide(NO_OPTIONAL)}>
            {copy.necessaryOnly}
          </Button>
          <Button size="sm" className={cn(PILL, "flex-1")} onClick={() => decide(ALL_OPTIONAL)}>
            {copy.acceptAll}
          </Button>
        </div>
        {expanded ? (
          <Button size="sm" variant="outline" className={cn(PILL, "w-full")} onClick={() => decide(draft)}>
            {copy.save}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
