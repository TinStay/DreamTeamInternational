import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { getDictionary } from "@/lib/i18n/config";
import { InvoiceOrderDialog, type OrderDetails, type OrderResult } from "./invoice-order-dialog";

/**
 * The order window of the invoice flow: nothing is paid on the site. It must say where the invoice goes, start from the
 * billing details Stripe already holds, send exactly what the client entered, and then say the invoice is on its way.
 */
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => "/en/pricing" }));

const c = getDictionary("en").plans.invoiceOrder;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function open(prefill: Record<string, unknown>, submit: (details: OrderDetails) => Promise<OrderResult>, renewal: string | null = null) {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ flow: "invoice", ...prefill }) })));
  render(
    <LanguageProvider>
      <InvoiceOrderDialog open onOpenChange={() => {}} title="Creator - monthly plan" price="$389.00 / month" renewal={renewal} afterPaid={c.afterPaid.plan} submit={submit} />
    </LanguageProvider>
  );
  return within(screen.getByRole("dialog"));
}

describe("InvoiceOrderDialog", () => {
  it("says the invoice goes to the client's email, with the order, its price and the renewal", async () => {
    const w = open({ email: "ada@example.com", name: "Ada Client", address: null, company: false }, async () => ({}), c.renewal.replace("{period}", "month"));
    expect(w.getByRole("heading", { name: "Creator - monthly plan" })).toBeTruthy();
    expect(w.getByText("$389.00 / month")).toBeTruthy();
    await waitFor(() => expect(w.getByText(new RegExp("ada@example.com"))).toBeTruthy());
    expect(w.getByText(new RegExp("renews every month by invoice"))).toBeTruthy();
    // Nothing is paid here: the button sends an invoice.
    expect(w.getByRole("button", { name: c.send })).toBeTruthy();
    expect(w.queryByText(/card/i)).toBeNull();
  });

  it("starts from the saved details, sends what was entered, then shows where the invoice went", async () => {
    const submit = vi.fn(async (): Promise<OrderResult> => ({ invoice: { number: "000000-0104", email: "ada@example.com", totalCents: 46680, currency: "usd", dueAt: "2026-11-18T00:00:00.000Z" } }));
    const w = open({ email: "ada@example.com", name: "Ada Client", company: false, address: { line1: "1 Main St", city: "Austin", state: "TX", postal_code: "78701", country: "US" } }, submit);
    await waitFor(() => expect((w.getByLabelText(c.address) as HTMLInputElement).value).toBe("1 Main St"));
    expect((w.getByLabelText(c.state) as HTMLInputElement).value).toBe("TX"); // a US address needs its state
    fireEvent.change(w.getByLabelText(c.city), { target: { value: "Dallas" } });
    fireEvent.click(w.getByRole("button", { name: c.send }));

    await waitFor(() => expect(w.getByRole("heading", { name: c.sentTitle })).toBeTruthy());
    expect(submit).toHaveBeenCalledWith({ name: "Ada Client", address: { line1: "1 Main St", city: "Dallas", state: "TX", postal_code: "78701", country: "US" } });
    expect(w.getByText(/000000-0104 for \$466\.80 was sent to ada@example\.com/)).toBeTruthy();
    expect(w.getByText(c.due.replace("{date}", "18-11-2026"))).toBeTruthy();
  });

  it("keeps a saved company's name, and shows the server's refusal in words", async () => {
    const w = open({ email: "ada@example.com", name: "Acme Inc.", company: true, address: { line1: "1 Main St", city: "Berlin", postal_code: "10115", country: "DE" } }, async () => ({ error: "invalid_details" }));
    await waitFor(() => expect(w.getByText(c.companyNote.replace("{name}", "Acme Inc."))).toBeTruthy());
    expect(w.queryByLabelText(c.name)).toBeNull();
    expect(w.queryByLabelText(c.state)).toBeNull();
    fireEvent.click(w.getByRole("button", { name: c.send }));
    await waitFor(() => expect(w.getByRole("alert").textContent).toBe(c.errors.invalid_details));
  });
});
