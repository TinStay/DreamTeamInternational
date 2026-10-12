import { paddle, type PaddleTransaction } from "@/lib/paddle";

/**
 * The product tax category of the video work (`PADDLE_TAX_CATEGORY`): `standard` unless set. Paddle only accepts a
 * category that is enabled on the account (Paddle → Checkout settings / support), so a value outside its list is ignored.
 */
const TAX_CATEGORIES = ["standard", "digital-goods", "professional-services", "saas", "training-services", "implementation-services"] as const;
export function taxCategory(): (typeof TAX_CATEGORIES)[number] {
  const v = process.env.PADDLE_TAX_CATEGORY?.trim() as (typeof TAX_CATEGORIES)[number] | undefined;
  return v && TAX_CATEGORIES.includes(v) ? v : "standard";
}

/**
 * One line priced on the server (a **non-catalog** price and product - the amount comes from `lib/pricing.ts` or the
 * database, never from the browser): USD, tax-exclusive (Paddle adds any sales tax / VAT on top - the US norm), and
 * recurring when `interval` is given (Paddle then creates a subscription when the checkout completes).
 */
export function lineItem(line: { name: string; description: string; amountCents: number; interval?: "month" | "year" }) {
  return {
    quantity: 1,
    price: {
      name: line.name.slice(0, 150),
      description: line.description.slice(0, 500).padEnd(2, "."),
      unit_price: { amount: String(Math.round(line.amountCents)), currency_code: "USD" },
      tax_mode: "account_setting",
      ...(line.interval ? { billing_cycle: { interval: line.interval, frequency: 1 } } : {}),
      product: { name: line.name.slice(0, 200), tax_category: taxCategory() },
    },
  };
}

/**
 * A transaction for the browser to pay in Paddle's overlay checkout (`lib/paddle-client.ts` opens it by id): on the
 * client's customer, with our custom data (Paddle copies it onto the subscription it creates and every renewal). Its
 * address and tax ID are collected in the checkout itself.
 */
export async function createCheckoutTransaction(input: { customerId: string; items: ReturnType<typeof lineItem>[]; customData: Record<string, string> }): Promise<PaddleTransaction> {
  return paddle<PaddleTransaction>("POST", "/transactions", {
    items: input.items,
    customer_id: input.customerId,
    currency_code: "USD",
    collection_mode: "automatic",
    custom_data: input.customData,
  });
}
