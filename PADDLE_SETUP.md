# Paddle setup - what to do in Paddle

The code is done: checkout, subscriptions, the webhook, invoices and cancel / resume all run on Paddle Billing. These are the
steps only you can take. Do them in the **sandbox** first, then repeat 2-6 in the live account.

## 1. Accounts

1. Sign up for a **sandbox** account at https://sandbox-login.paddle.com/signup (instant, for testing).
2. Sign up for the **live** account at https://login.paddle.com/signup and complete **verification** (business: DT A I,
   Sofia; your identity; the payout bank account). Paddle reviews the business and the domain before live payments work.
   Tell them plainly what you sell (AI-generated video, delivered digitally, as one-off orders and monthly plans) and ask
   them to confirm it is accepted - their policy excludes human services that are not tied to software.

## 2. Website approval (live account)

**Paddle → Checkout → Website approval** → add `keplerbay.com`. Paddle checks the site has: pricing, terms (with the
Paddle merchant-of-record clause - done, §2.5 of the terms), a privacy policy (done), a refund policy, and a working
contact email. If they ask for a separate refund page, tell me and I'll add one.

## 3. Keys

**Paddle → Developer tools → Authentication**:
- **API key** → `PADDLE_API_KEY` (give it read + write on transactions, customers, addresses, subscriptions).
- **Client-side token** → `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`.

## 4. Checkout settings

**Paddle → Checkout → Checkout settings**:
- **Default payment link**: `https://keplerbay.com/en/pricing` (sandbox: your Vercel preview URL or `http://localhost:3000/en/pricing`).
- Payment methods: cards, Apple Pay, Google Pay, PayPal - your choice.
- Optional: upload the Keplerbay logo and set the brand colour (`#FF6A14`) under **Checkout → Branding**.

## 5. Webhook

**Paddle → Developer tools → Notifications → New destination**:
- URL: `https://keplerbay.com/api/paddle/webhook`
- Events: `transaction.completed`, `transaction.canceled`, `transaction.payment_failed`, `subscription.created`,
  `subscription.updated`, `subscription.activated`, `subscription.canceled`, `subscription.past_due`,
  `subscription.paused`, `subscription.resumed`, `subscription.trialing`
- Copy its **secret key** → `PADDLE_WEBHOOK_SECRET`.

## 6. Environment variables (Vercel → Settings → Environment Variables, and `.env.local`)

```
PADDLE_API_KEY=...
PADDLE_WEBHOOK_SECRET=...
PADDLE_ENVIRONMENT=sandbox            # production for the live account
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=...
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox # must match PADDLE_ENVIRONMENT
```

Remove the old `STRIPE_*` variables. Redeploy after changing them (the `NEXT_PUBLIC_` ones are baked in at build).

## 7. Database

Run `supabase/paddle.sql` once in the Supabase SQL editor (adds the `paddle_*` id columns). Safe to run twice.

## 8. Test (sandbox)

1. Buy the Personal video on `/en/pricing` - card `4242 4242 4242 4242`, any future date, CVC `100`.
2. You land on Your Projects and the seconds appear; the order on `/account` reads paid, with an invoice + PDF.
3. Buy a subscription → it shows on `/account`; cancel → "active until …"; resume.
4. From the admin dashboard → Clients → a client → Invoices, send a custom invoice; it arrives by email from Paddle.

## 9. Before going live - ask your accountant

Paddle is the **merchant of record**: it sells to the client, charges and remits sales tax / VAT worldwide, issues the
invoices, and pays DT A I the net amount (Paddle's fee is 5% + $0.50 per transaction). Ask how DT A I should book
Paddle's payouts in Bulgaria. Tax category: `standard` by default; ask Paddle support whether AI video production should
be `professional-services`, and if they enable it, set `PADDLE_TAX_CATEGORY=professional-services`.

Refunds are made in Paddle (**Transactions → a transaction → Refund**) - including a declined paid change request.
