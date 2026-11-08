import type Stripe from "stripe";
import { LEGAL_NAME_FULL, LEGAL_UIC, LEGAL_VAT } from "@/lib/brand";

/**
 * The three kinds of invoice DT A I issues (`STRIPE_SETUP.md` §7a, drafted from the company's own invoices on 08-11-2026 -
 * **the accountant still has to confirm the wording and the rules**):
 *
 * - `bg` - a client in Bulgaria: in Bulgarian, 20% VAT, the company named in Cyrillic.
 * - `intl_zero` - a business outside Bulgaria with a tax ID (an EU business with a VAT number, or a company outside the
 *   EU, e.g. Fiverr / Israel, MindGuard / Switzerland): 0% VAT under чл. 21, ал. 2 ЗДДС, plus the reverse-charge line for
 *   an EU business.
 * - `intl_vat` - a client outside Bulgaria with no tax ID (a private person): Bulgarian VAT, no exemption line. Which of
 *   these may go without VAT is the accountant's call; until then they are invoiced with VAT.
 *
 * Stripe's invoice templates can only be made in the Dashboard, so the same texts are written onto the **Stripe customer**
 * (`invoice_settings.footer` / `custom_fields`, `preferred_locales`) once their country is known. Every invoice for that
 * customer - a site payment, a renewal, one the team sends, one made by hand in the Dashboard - then carries them.
 */
export type InvoiceProfileKey = "bg" | "intl_zero" | "intl_vat";

/** EU member states (ISO 3166-1 alpha-2), Bulgaria included. */
export const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "IT",
  "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK",
]);

/** Which invoice a client gets, from their billing country and whether they gave a tax ID; `null` while the country is unknown. */
export function invoiceProfileFor(country: string | null | undefined, hasTaxId: boolean): InvoiceProfileKey | null {
  const code = (country ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  if (code === "BG") return "bg";
  return hasTaxId ? "intl_zero" : "intl_vat";
}

/** The bank line under every invoice. The IBAN is read from the environment only - it is never written in the code. */
export type BankDetails = { name: string; iban: string; bic: string };

export function bankDetails(env: Record<string, string | undefined> = process.env): BankDetails | null {
  const iban = env.INVOICE_BANK_IBAN?.replace(/\s+/g, "").toUpperCase();
  if (!iban || !/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return null;
  return { name: env.INVOICE_BANK_NAME?.trim() || "Bank DSK", iban, bic: env.INVOICE_BANK_BIC?.trim() || "STSABGSF" };
}

export type InvoiceSettings = {
  footer: string;
  customFields: { name: string; value: string }[];
  locales: string[];
};

const BG_ADDRESS = "ул. „Николай Коперник“ № 27-29, ет. 2, офис 17, ж.к. „Гео Милев“, 1574 София";
const EN_ADDRESS = "27-29 Nikolay Kopernik St, floor 2, office 17, 1574 Sofia, Bulgaria";

/** The footer, the header fields (at most four - Stripe's limit) and the language for one kind of invoice. */
export function invoiceSettingsFor(key: InvoiceProfileKey, country: string | null | undefined, bank: BankDetails | null): InvoiceSettings {
  if (key === "bg") {
    const bankLine = bank ? ` · Банка: ${bank.name} · IBAN: ${bank.iban} · BIC: ${bank.bic}` : "";
    return {
      footer: `ДТ Ей Ай ООД · ЕИК ${LEGAL_UIC} · ДДС № ${LEGAL_VAT} · МОЛ: Стоян Янчев Янчев · ${BG_ADDRESS}${bankLine}`,
      customFields: [
        { name: "Дата на данъчно събитие", value: "Датата на издаване" },
        { name: "Срок за плащане", value: "14 дни от датата на издаване" },
      ],
      locales: ["bg", "en"],
    };
  }
  const bankLine = bank ? ` · Bank: ${bank.name} · IBAN: ${bank.iban} · BIC/SWIFT: ${bank.bic}` : "";
  const footer = `${LEGAL_NAME_FULL} · UIC ${LEGAL_UIC} · VAT ${LEGAL_VAT} · ${EN_ADDRESS}${bankLine}`;
  const customFields = [{ name: "Date of supply", value: "Same as the invoice date" }];
  if (key === "intl_zero") {
    customFields.push({ name: "VAT / ДДС", value: "0% - чл. 21, ал. 2 от ЗДДС" });
    if (EU_COUNTRIES.has((country ?? "").toUpperCase())) {
      customFields.push({ name: "Reverse charge", value: "Art. 196 Directive 2006/112/EC" });
    }
  }
  customFields.push({ name: "Payment terms", value: "14 days from the invoice date" });
  return { footer, customFields, locales: ["en"] };
}

/**
 * Writes the right invoice texts onto a Stripe customer, from the billing address and tax IDs Stripe holds for them.
 * Returns the kind applied, or `null` while their country is unknown (their invoices then keep the plain footer).
 * Never throws: a failure only means the next invoice carries the plain footer.
 */
export async function applyInvoiceProfile(stripe: Stripe, customerId: string): Promise<InvoiceProfileKey | null> {
  try {
    const found = await stripe.customers.retrieve(customerId, { expand: ["tax_ids"] });
    if ("deleted" in found && found.deleted) return null;
    const customer = found as Stripe.Customer;
    const country = customer.address?.country ?? null;
    const key = invoiceProfileFor(country, (customer.tax_ids?.data.length ?? 0) > 0);
    if (!key) return null;
    const settings = invoiceSettingsFor(key, country, bankDetails());
    const current = customer.invoice_settings;
    const same =
      customer.metadata?.invoice_profile === key &&
      current?.footer === settings.footer &&
      JSON.stringify(current?.custom_fields ?? []) === JSON.stringify(settings.customFields);
    if (!same) {
      await stripe.customers.update(customerId, {
        preferred_locales: settings.locales,
        invoice_settings: { footer: settings.footer, custom_fields: settings.customFields },
        metadata: { invoice_profile: key },
      });
    }
    return key;
  } catch {
    return null;
  }
}
