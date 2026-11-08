# Stripe setup - what to do in Stripe

The code is done: checkout, subscriptions, the webhook, invoices and cancel / resume all run on Stripe. DT A I is the
seller, Stripe processes the payments. Do steps 1-6 in **test mode** first, then repeat 3-6 with the live keys.

## 1. Account

Sign up at https://dashboard.stripe.com/register with DT A I, Bulgaria. Describe the business plainly: AI-generated video,
delivered digitally, sold as one-off orders and monthly plans. Add the payout bank account.

## 2. Public details

**Settings → Public details**: business name, support email `hq@keplerbay.com`, website, and the links to the terms
(`/en/terms`), the privacy policy (`/en/privacy`) and the refund policy (`/en/refunds`). Add the logo and the brand colour
(`#FF6A14`) under **Settings → Branding**.

## 3. Keys

**Developers → API keys** → the secret key → `STRIPE_SECRET_KEY`.

## 4. Webhook

**Developers → Webhooks → Add destination**:
- URL: `https://www.keplerbay.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
  `checkout.session.expired`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`
- Copy its **signing secret** → `STRIPE_WEBHOOK_SECRET`.

## 5. Emails and renewals

**Settings → Billing → Subscriptions and emails**: turn on emails for upcoming renewals (the terms promise a reminder
before an annual plan renews) and for failed payments, and retries for failed cards. **Settings → Customer emails**: turn
on receipts for successful payments and refunds.

## 6. Environment variables (Vercel → Settings → Environment Variables, and `.env.local`)

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_TAX_ENABLED=                # true once step 7 is done
STRIPE_TAX_CODE=                   # optional: the txcd_ code the accountant confirms
STRIPE_TOS_CONSENT=                # true for a required tick box at checkout (needs the Terms link from step 2)
```

Remove the `PADDLE_*` variables. Redeploy after changing them.

## 7. Tax and invoices - decide with the accountant first

Stripe Tax collects only where the account has an active registration (**Tax → Locations**), and with none it silently
collects nothing, so the site says "tax added at checkout" while adding none until this is done. The accountant decides:
- the tax treatment of the video work, for businesses and individuals, in Bulgaria, the EU and the US, and whether OSS applies;
- whether Stripe's invoices are enough, or a Bulgarian invoicing program is needed (Stripe's numbers are `PREFIX-0001`);
- whether card sales need a fiscal receipt or another document under Ordinance N-18.

## 8. Test (test mode)

1. Buy the Personal video on `/en/pricing` - card `4242 4242 4242 4242`, any future date, any CVC.
2. You land on Your Projects and the seconds appear; the order on `/account` reads paid, with an invoice.
3. Buy a subscription → it shows on `/account`; cancel → "active until …"; resume.
4. From the admin dashboard → Clients → a client → Invoices, send a custom invoice; it arrives by email from Stripe.

To test on your computer, forward the webhook with the Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

Refunds are made in Stripe (**Payments → a payment → Refund**), including a declined paid change request. The video time is
taken back with an adjustment in the Clients tab.
