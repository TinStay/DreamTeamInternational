"use client";

import Link from "next/link";
import { IconFileText, IconMail, IconReceiptRefund, IconTag } from "@tabler/icons-react";
import { AccountShell, ACCOUNT_CARD } from "@/components/account-shell";
import { ContactInquiryForm } from "@/components/contact-inquiry-form";
import { useLanguage } from "@/lib/i18n/language-context";
import { EMAIL_PRIMARY } from "@/lib/contact-info";
import { LEGAL_NAME_FULL, LEGAL_UIC, LEGAL_VAT } from "@/lib/brand";
import { pricingPath, refundsPath, termsPath } from "@/lib/routes";

const PEARL_TEXT =
  "bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_30%,#ffd2a1_48%,#ff9a3c_62%,#ff5e00_100%)] bg-clip-text text-transparent";

const LINK_ROW =
  "group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-white/80 transition-[background-color,color,transform] duration-200 ease-out hover:translate-x-1 hover:bg-white/[0.05] hover:text-white";

/**
 * The contact page (`/contact`): the message form (`/api/contact`), the public email, the pages most questions are
 * answered on, and - small, at the foot - the legal seller's details (name, UIC, VAT number, registered address), as EU
 * e-commerce law and Stripe's website review ask. The address stays off the rest of the site's visible chrome.
 */
export function ContactPageView() {
  const { t, language } = useLanguage();
  const c = t.contactPage;

  const links = [
    { href: pricingPath(language), label: c.links.pricing, Icon: IconTag },
    { href: refundsPath(language), label: c.links.refunds, Icon: IconReceiptRefund },
    { href: termsPath(language), label: c.links.terms, Icon: IconFileText },
  ];

  return (
    <AccountShell sideNav={false}>
      <header className="mt-8 max-w-4xl sm:mt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{c.eyebrow}</p>
        <h1 className="mt-3 font-heading text-[clamp(38px,6vw,96px)] leading-[0.94] font-black uppercase tracking-[-0.015em] text-balance">
          {c.title1} <span className={PEARL_TEXT}>{c.title2}</span>
        </h1>
        <p className="mt-6 max-w-[62ch] text-[clamp(16px,1.3vw,21px)] leading-relaxed text-white/75">{c.lead}</p>
      </header>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.35fr_0.85fr] lg:items-start">
        <section aria-labelledby="contact-form-heading" className={`${ACCOUNT_CARD} p-6 sm:p-9`}>
          <h2 id="contact-form-heading" className="font-heading text-[clamp(20px,2vw,28px)] font-black uppercase leading-tight">
            {c.formTitle}
          </h2>
          <ContactInquiryForm variant="plain" subject={c.formSubject} formStateBg="Контакт" className="mt-6" />
        </section>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="contact-email-heading" className={`${ACCOUNT_CARD} p-6 sm:p-8`}>
            <h2 id="contact-email-heading" className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              {c.emailTitle}
            </h2>
            <a
              href={EMAIL_PRIMARY.href}
              className="group mt-4 inline-flex cursor-pointer items-center gap-3 text-[clamp(18px,1.6vw,22px)] font-bold text-white transition-[color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:text-[#ffb066]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#ff8a1f]/15 text-[#ff8a1f] transition-transform duration-200 group-hover:scale-110">
                <IconMail className="size-5" aria-hidden />
              </span>
              <span className="break-all">{EMAIL_PRIMARY.label}</span>
            </a>
            <p className="mt-4 text-sm leading-relaxed text-white/60">{c.emailNote}</p>
          </section>

          <section aria-labelledby="contact-help-heading" className={`${ACCOUNT_CARD} p-4 sm:p-5`}>
            <h2 id="contact-help-heading" className="px-3 pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              {c.linksTitle}
            </h2>
            <ul className="mt-2 flex flex-col">
              {links.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link href={href} className={LINK_ROW}>
                    <Icon className="size-5 shrink-0 text-[#ff8a1f] transition-transform duration-200 group-hover:scale-110" aria-hidden />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* The seller's details: small, at the foot of the page. */}
      <section aria-labelledby="company-details-heading" className="mt-14 border-t border-white/10 pt-6 text-sm text-white/55">
        <h2 id="company-details-heading" className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
          {c.companyTitle}
        </h2>
        <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-white/40">{c.company.name}</dt>
            <dd>
              {LEGAL_NAME_FULL}, {c.company.trading}
            </dd>
          </div>
          <div>
            <dt className="text-white/40">{c.company.uic}</dt>
            <dd>{LEGAL_UIC}</dd>
          </div>
          <div>
            <dt className="text-white/40">{c.company.vat}</dt>
            <dd>{LEGAL_VAT}</dd>
          </div>
          <div>
            <dt className="text-white/40">{c.company.address}</dt>
            <dd>{t.contact.addressVal}</dd>
          </div>
        </dl>
      </section>
    </AccountShell>
  );
}
