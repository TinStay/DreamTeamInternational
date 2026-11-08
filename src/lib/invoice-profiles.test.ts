import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { applyInvoiceProfile, bankDetails, invoiceProfileFor, invoiceSettingsFor } from "@/lib/invoice-profiles";

describe("invoiceProfileFor", () => {
  it("gives a Bulgarian client the Bulgarian invoice, with or without a tax ID", () => {
    expect(invoiceProfileFor("BG", false)).toBe("bg");
    expect(invoiceProfileFor("bg", true)).toBe("bg");
  });
  it("gives a business abroad with a tax ID the 0% invoice", () => {
    expect(invoiceProfileFor("CH", true)).toBe("intl_zero");
    expect(invoiceProfileFor("DE", true)).toBe("intl_zero");
    expect(invoiceProfileFor("IL", true)).toBe("intl_zero");
  });
  it("gives a person abroad the invoice with VAT, inside the EU and outside it", () => {
    expect(invoiceProfileFor("FR", false)).toBe("intl_vat");
    expect(invoiceProfileFor("US", false)).toBe("intl_vat");
  });
  it("gives a customer marked reverse-charge the 0% invoice, with or without a tax ID", () => {
    expect(invoiceProfileFor("US", false, true)).toBe("intl_zero");
    expect(invoiceProfileFor("DE", false, true)).toBe("intl_zero");
    expect(invoiceProfileFor("BG", false, true)).toBe("bg");
  });
  it("waits while the country is unknown", () => {
    expect(invoiceProfileFor(null, true)).toBeNull();
    expect(invoiceProfileFor("", false)).toBeNull();
    expect(invoiceProfileFor("Bulgaria", false)).toBeNull();
  });
});

describe("invoiceSettingsFor", () => {
  const bank = { name: "Bank DSK", iban: "BG00TEST00000000000000", bic: "STSABGSF" };

  it("writes the Bulgarian invoice in Bulgarian, the company in Cyrillic", () => {
    const s = invoiceSettingsFor("bg", "BG", bank);
    expect(s.locales[0]).toBe("bg");
    expect(s.footer).toContain("ДТ Ей Ай ООД");
    expect(s.footer).toContain("ЕИК 208668338");
    expect(s.footer).toContain("IBAN: BG00TEST00000000000000");
    expect(s.customFields.map((f) => f.name)).toContain("Дата на данъчно събитие");
  });
  it("gives the 0% invoice its legal basis, and an EU business the reverse charge too", () => {
    const swiss = invoiceSettingsFor("intl_zero", "CH", null);
    expect(swiss.footer).toContain("DT A I Ltd.");
    expect(swiss.footer).not.toContain("ДТ Ей Ай");
    expect(swiss.footer).not.toContain("IBAN");
    expect(swiss.customFields).toContainEqual({ name: "VAT / ДДС", value: "0% - чл. 21, ал. 2 от ЗДДС" });
    expect(swiss.customFields.some((f) => f.name === "Reverse charge")).toBe(false);
    const german = invoiceSettingsFor("intl_zero", "DE", null);
    expect(german.customFields.some((f) => f.name === "Reverse charge")).toBe(true);
  });
  it("keeps every kind within Stripe's four header fields", () => {
    for (const [key, country] of [["bg", "BG"], ["intl_zero", "DE"], ["intl_zero", "CH"], ["intl_vat", "FR"]] as const) {
      expect(invoiceSettingsFor(key, country, bank).customFields.length).toBeLessThanOrEqual(4);
    }
  });
  it("gives the invoice with VAT no exemption line", () => {
    expect(invoiceSettingsFor("intl_vat", "FR", null).customFields.some((f) => f.name === "VAT / ДДС")).toBe(false);
  });
});

describe("bankDetails", () => {
  it("reads the IBAN from the environment only, and refuses a malformed one", () => {
    expect(bankDetails({})).toBeNull();
    expect(bankDetails({ INVOICE_BANK_IBAN: "not an iban" })).toBeNull();
    expect(bankDetails({ INVOICE_BANK_IBAN: "bg00 test 0000 0000 0000 00" })).toEqual({ name: "Bank DSK", iban: "BG00TEST00000000000000", bic: "STSABGSF" });
  });
});

describe("applyInvoiceProfile", () => {
  function stripeWith(customer: Partial<Stripe.Customer>) {
    const update = vi.fn().mockResolvedValue({});
    const retrieve = vi.fn().mockResolvedValue({ id: "cus_1", metadata: {}, invoice_settings: {}, tax_ids: { data: [] }, ...customer });
    return { stripe: { customers: { retrieve, update } } as unknown as Stripe, update };
  }

  it("writes the texts onto the customer from their address", async () => {
    const { stripe, update } = stripeWith({ address: { country: "BG" } as Stripe.Address });
    expect(await applyInvoiceProfile(stripe, "cus_1")).toBe("bg");
    expect(update).toHaveBeenCalledWith("cus_1", expect.objectContaining({ preferred_locales: ["bg", "en"], metadata: { invoice_profile: "bg" } }));
  });
  it("leaves a customer with no country alone", async () => {
    const { stripe, update } = stripeWith({ address: null });
    expect(await applyInvoiceProfile(stripe, "cus_1")).toBeNull();
    expect(update).not.toHaveBeenCalled();
  });
  it("never throws", async () => {
    const stripe = { customers: { retrieve: vi.fn().mockRejectedValue(new Error("down")) } } as unknown as Stripe;
    expect(await applyInvoiceProfile(stripe, "cus_1")).toBeNull();
  });
});
