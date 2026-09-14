"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { motion } from "motion/react";
import { IconCheck, IconMailFilled, IconPhoneFilled } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { EMAIL_PRIMARY, PHONE_PRIMARY } from "@/lib/contact-info";
import { cn } from "@/lib/utils";

const FEEDBACK_MS = 1800;

type CopyIconButtonProps = {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** What gets copied (also the tooltip). */
  value: string;
  /** Where to go if the clipboard is unavailable (insecure origin, permissions). */
  fallbackHref: string;
  copyLabel: string;
  copiedLabel: string;
  className?: string;
};

/**
 * Header contact control: a plain round icon button that copies its value on
 * click and confirms with a check + a small "copied" tag underneath. No hover
 * choreography on purpose - the feedback IS the interaction. Falls back to the
 * `tel:` / `mailto:` link if the clipboard API is unavailable (or blocked).
 */
function CopyIconButton({ icon: Icon, value, fallbackHref, copyLabel, copiedLabel, className }: CopyIconButtonProps) {
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
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), FEEDBACK_MS);
    } catch {
      window.location.href = fallbackHref;
    }
  }

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`${copyLabel}: ${value}`}
        title={value}
        className={cn(
          "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-card-border bg-foreground/[0.07] text-foreground dark:bg-card-elevated",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          copied && "text-emerald-500 dark:text-emerald-400"
        )}
      >
        {copied ? <IconCheck className="size-[18px]" aria-hidden /> : <Icon className="size-[18px]" aria-hidden />}
      </button>
      {/* Confirmation tag under the button (enter-only - exit gating hangs with the current motion version). */}
      {copied ? (
        <motion.span
          role="status"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-card-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground shadow-md"
        >
          {copiedLabel}
        </motion.span>
      ) : null}
    </span>
  );
}

/** Desktop header: copies the phone number. */
export function PhoneCopyButton({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <CopyIconButton
      icon={IconPhoneFilled}
      value={PHONE_PRIMARY.label}
      fallbackHref={PHONE_PRIMARY.href}
      copyLabel={t.header.phoneCopy}
      copiedLabel={t.header.phoneCopied}
      className={className}
    />
  );
}

/** Desktop header: copies the email address. */
export function EmailCopyButton({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <CopyIconButton
      icon={IconMailFilled}
      value={EMAIL_PRIMARY.label}
      fallbackHref={EMAIL_PRIMARY.href}
      copyLabel={t.header.emailCopy}
      copiedLabel={t.header.phoneCopied}
      className={className}
    />
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
        "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-[var(--primary-gradient-start)] to-[var(--primary-gradient-end)] text-white",
        "shadow-[0_8px_20px_var(--primary-elevated-shadow)] transition-transform duration-200 ease-out hover:scale-105 active:scale-95",
        className
      )}
    >
      <IconPhoneFilled className="size-[17px]" aria-hidden />
    </a>
  );
}

/** Mobile header control: opens the mail app. */
export function EmailIconLink({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <a
      href={EMAIL_PRIMARY.href}
      aria-label={`${t.header.emailCopy}: ${EMAIL_PRIMARY.label}`}
      className={cn(
        "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-card-border bg-foreground/[0.07] text-foreground dark:bg-card-elevated",
        className
      )}
    >
      <IconMailFilled className="size-[17px]" aria-hidden />
    </a>
  );
}
