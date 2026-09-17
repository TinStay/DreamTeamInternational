"use client";

import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

/**
 * The strip at the top of the contact page: one line and the site's quote
 * pill, which scrolls down to the service cards + step form under the contact
 * form (`#quote` - the same-page hash goes through the smooth scroll and lands
 * clear of the header).
 */
export function ContactQuoteCta({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-4 rounded-2xl border border-card-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6",
        className
      )}
    >
      <p className="max-w-xl text-base text-muted-foreground sm:text-lg">{t.contactPage.quoteLead}</p>
      <ButtonWithIcon href="#quote" surface="auto" className="shrink-0">
        {t.services.quoteCta}
      </ButtonWithIcon>
    </div>
  );
}
