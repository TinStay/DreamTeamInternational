"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconCheck, IconPhoneFilled } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { PHONE_PRIMARY } from "@/lib/contact-info";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const FEEDBACK_MS = 1800;

/**
 * Desktop header phone control: an icon-only pill that reveals the number on
 * hover/focus and copies it on click, with a short "copied" confirmation.
 * Falls back to a `tel:` link if the clipboard API is unavailable (or blocked).
 */
export function PhoneCopyButton({ className }: { className?: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(PHONE_PRIMARY.label);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), FEEDBACK_MS);
    } catch {
      // Clipboard blocked (insecure origin, permissions) — dial instead.
      window.location.href = PHONE_PRIMARY.href;
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`${t.header.phoneCopy}: ${PHONE_PRIMARY.label}`}
      title={PHONE_PRIMARY.label}
      className={cn(
        "group/phone relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-card-border bg-foreground/[0.07] px-3 text-base font-semibold text-foreground",
        "transition-[background-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-px hover:bg-foreground/[0.12] hover:shadow-[0_10px_24px_-10px_rgba(2,6,23,0.55)] active:translate-y-0 active:scale-[0.98]",
        "dark:bg-card-elevated dark:hover:bg-muted/60",
        className
      )}
    >
      <span className="relative flex size-5 shrink-0 items-center justify-center">
        <AnimatePresence initial={false} mode="wait">
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              className="absolute inset-0 flex items-center justify-center text-emerald-500 dark:text-emerald-400"
            >
              <IconCheck className="size-5" stroke={3} aria-hidden />
            </motion.span>
          ) : (
            <motion.span
              key="phone"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.18, ease: EASE }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <IconPhoneFilled className="size-4.5 transition-transform duration-300 group-hover/phone:rotate-12" aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      {/* Label reveals on hover/focus (and while confirming) via a 0fr -> 1fr grid column. */}
      <span
        className={cn(
          "grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 ease-out",
          "group-hover/phone:grid-cols-[1fr] group-focus-visible/phone:grid-cols-[1fr]",
          copied && "grid-cols-[1fr]"
        )}
      >
        <span className="overflow-hidden">
          <span className="block whitespace-nowrap pr-1 tabular-nums">
            {copied ? t.header.phoneCopied : PHONE_PRIMARY.label}
          </span>
        </span>
      </span>
    </button>
  );
}

/** Mobile header control: gradient icon button that dials straight away. */
export function PhoneIconLink({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <a
      href={PHONE_PRIMARY.href}
      aria-label={`${t.header.contactCta}: ${PHONE_PRIMARY.label}`}
      className={cn(
        "inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-[var(--primary-gradient-start)] to-[var(--primary-gradient-end)] text-white",
        "shadow-[0_8px_20px_var(--primary-elevated-shadow)] transition-transform duration-200 ease-out hover:scale-105 active:scale-95",
        className
      )}
    >
      <IconPhoneFilled className="size-[18px]" aria-hidden />
    </a>
  );
}
