import { describe, expect, it } from "vitest";
import { euVatValue, parseCompany } from "@/lib/company-details";
import { invoiceSettingsFor } from "@/lib/invoice-profiles";

describe("parseCompany", () => {
  it("takes a US company with its EIN", () => {
    expect(parseCompany({ name: "  Acme   Inc ", country: "us", number: "12-3456789" })).toEqual({ name: "Acme Inc", country: "US", number: "12-3456789" });
  });
  it("lets a Bulgarian company leave the VAT number out", () => {
    expect(parseCompany({ name: "Firma OOD", country: "BG", number: "" })).toEqual({ name: "Firma OOD", country: "BG", number: "" });
  });
  it("asks an EU company for its VAT number and a company abroad for its number", () => {
    expect(parseCompany({ name: "Test GmbH", country: "DE", number: "" })).toBe("vat_required");
    expect(parseCompany({ name: "Acme", country: "US", number: "" })).toBe("invalid_number");
  });
  it("refuses a missing name, a bad country or an odd number", () => {
    expect(parseCompany({ name: "A", country: "US", number: "123" })).toBe("invalid_name");
    expect(parseCompany({ name: "Acme", country: "USA", number: "123" })).toBe("invalid_country");
    expect(parseCompany({ name: "Acme", country: "US", number: "<script>" })).toBe("invalid_number");
  });
});

describe("euVatValue", () => {
  it("adds the country prefix once, and EL for Greece", () => {
    expect(euVatValue("DE", "123 456 789")).toBe("DE123456789");
    expect(euVatValue("DE", "de123456789")).toBe("DE123456789");
    expect(euVatValue("GR", "123456789")).toBe("EL123456789");
  });
});

describe("the company number on the invoice", () => {
  it("is shown for a company outside the EU, within Stripe's four fields", () => {
    const s = invoiceSettingsFor("intl_zero", "US", null, "12-3456789");
    expect(s.customFields).toContainEqual({ name: "Client company no.", value: "12-3456789" });
    expect(s.customFields.length).toBeLessThanOrEqual(4);
  });
});
