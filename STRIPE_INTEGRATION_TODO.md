# Stripe integration - TODO

The single source of truth for what is left to do on Stripe Checkout. The site uses **hosted Stripe Checkout**: the
server creates a Checkout Session and the customer is redirected to Stripe's page to pay.

This was an update of an existing integration (Scenario A): both places that create a Checkout Session now carry the
parameters configured in **Checkout Studio**. Nothing else about the flow changed.

## Values to Replace

**None.** Every `sample_only` parameter already has a real value in the code, so there are no placeholders to swap:

| Field | Current Value | Notes |
|-------|--------------|-------|
| mode | `payment` for a one-time video or a change request, `subscription` for a plan | Chosen per purchase from `lib/pricing.ts`. |
| success_url | `<site>/en/my-projects?purchase=success` (packs), `<site>/en/my-projects/<id>?request=paid` (change requests) | Built from the request's own origin, so it is right on localhost and in production. |
| cancel_url | `<site>/en/pricing?cancelled=1` (packs), `<site>/en/my-projects/<id>?request=cancelled` (change requests) | Same. |
| line_items | `price_data` priced on the server | No Price IDs on purpose: the price is worked out on the server for every order (the Personal video's length slider, plan and billing, a change request's cost), so the browser can never set it. Nothing to create in the Dashboard. |

## Configured Parameters

These come from Checkout Studio and are set in every session.

**Files containing these parameters:**
- [src/lib/stripe-tax.ts](src/lib/stripe-tax.ts) - `checkoutStudioParams(mode)` and `checkoutTaxAndInvoice(...)`
- [src/app/api/checkout/route.ts](src/app/api/checkout/route.ts) - video packs and subscriptions
- [src/app/api/project-requests/checkout/route.ts](src/app/api/project-requests/checkout/route.ts) - paid change requests

| Parameter | Value |
|-----------|-------|
| ui_mode | `hosted_page` (the installed `stripe` SDK is 22.6.2, so 21+ applies) |
| billing_address_collection | `required` |
| phone_number_collection | `{ enabled: false }` |
| automatic_tax | `{ enabled: false }` - see the note below |
| allow_promotion_codes | `true` |
| payment_method_collection | `always` - subscriptions only (Stripe accepts it only in subscription mode) |
| submit_type | `auto` - one-time payments only (Stripe accepts it only in payment mode) |
| consent_collection | `{ promotions: "auto" }` |
| integration_identifier | `hosted_web_0001` |
| origin_context | `web` |

**`automatic_tax`** follows the `STRIPE_TAX_ENABLED` environment variable, which is unset (so `false`), matching the
Studio setting. Leave it off until Stripe Tax is set up (see `supabase/README.md` §2b): with it on and no tax
registration, Stripe collects no tax and shows no error.

### Kept on purpose (not in the Studio's list)

The task asked to drop parameters the Studio does not list. These were **kept** because the app depends on them. Removing
them would stop paid orders from adding video time, and would turn off invoices and tax IDs:

| Parameter | Why it stays |
|-----------|-------------|
| `customer` | The client's one Stripe customer (`lib/stripe-customers.ts`), so invoices, address and tax ID stay together. |
| `client_reference_id`, `metadata`, `payment_intent_data.metadata`, `subscription_data.metadata` | The webhook reads them to credit video seconds and settle the order (`lib/stripe-credits.ts`). |
| `customer_update` | Saves the address entered at checkout to the customer (needed with an existing customer and `tax_id_collection`). |
| `tax_id_collection` | Lets a business enter its tax ID, which goes on its invoice. |
| `invoice_creation` | Issues an invoice for every one-time payment (subscriptions are invoiced by Billing). |

## Setup

1. **Environment variables**, in `.env.local` locally and in Vercel → Settings → Environment Variables:
   ```
   STRIPE_SECRET_KEY=sk_test_...       # a restricted rk_ key in production
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_TAX_ENABLED=false            # true only once Stripe Tax is set up
   ```
   No publishable key is needed: nothing in the browser talks to Stripe (the server redirects to the hosted page).
2. **Webhook** - Dashboard → Developers → Webhooks → endpoint `https://<your site>/api/stripe/webhook` with
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
   `checkout.session.expired`, `invoice.paid`, `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
3. **Promotion codes** - `allow_promotion_codes` only shows the field; create the coupons and promotion codes in
   Dashboard → Products → Coupons.
4. **Promotional consent** - `consent_collection.promotions: "auto"` shows the opt-in only where the law requires it.
   The answer is on the session (`session.consent.promotions`); nothing in the app stores it yet (see Next steps).

No new files or routes were created besides this one.

## How it works

1. The client picks a plan on `/pricing` (or pays for a change on a project page).
2. `POST /api/checkout` (or `/api/project-requests/checkout`) checks who they are, prices the order on the server,
   records a pending order and creates the Checkout Session.
3. The browser goes to Stripe's hosted page. The client pays, enters their billing address and, optionally, a tax ID or
   promotion code.
4. Stripe calls `/api/stripe/webhook`. Once money is actually collected, the client's video seconds are added, the order
   is marked paid, an invoice is issued, and the subscription is mirrored and emailed about.
5. Stripe sends the client back to the success URL.

## Testing

- Use test keys (`sk_test_…`) and test mode, ideally in a separate Stripe sandbox.
- Card that succeeds: `4242 4242 4242 4242`, any future date, any CVC, any ZIP.
- Card that needs 3-D Secure: `4000 0025 0000 3155`. Card that is declined: `4000 0000 0000 9995`.
- More: https://docs.stripe.com/testing

## Next steps

- If marketing emails will be sent, store `session.consent.promotions === "opt_in"` from the webhook (e.g. on the
  client's profile) and only email those who opted in.
- Create the promotion codes you want to offer.
- Set up Stripe Tax before turning `STRIPE_TAX_ENABLED` on (`supabase/README.md` §2b).
- Optional: the Stripe customer portal for self-serve plan changes (today the team swaps the price in Stripe, and the
  webhook updates the plan and sends the upgrade email).

## Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
