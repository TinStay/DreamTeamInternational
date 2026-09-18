"use client";

import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

/**
 * The slim card on the contact page, under the form and right above the
 * service cards + step form: the site's main CTA as its title („Поискай
 * оферта“) with the one-line lead under it, and the quote pill at the right
 * end of the row (under the copy on phones), which scrolls on to the cards
 * (`#quote` - the same-page hash goes through the smooth scroll and lands
 * clear of the header). The review badges sit under the contact details.
 */
export function ContactQuoteCta({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-2xl border border-card-border bg-card px-5 py-5 shadow-elevated-soft sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10",
        className
      )}
    >
      <div>
        <h2 className="font-heading text-2xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-3xl">{t.services.quoteCta}</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">{t.contactPage.quoteLead}</p>
      </div>
      <ButtonWithIcon href="#quote" surface="auto" className="shrink-0">
        {t.services.quoteCta}
      </ButtonWithIcon>
    </div>
  );
}
