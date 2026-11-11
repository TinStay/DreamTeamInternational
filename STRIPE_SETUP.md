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
- Optional: `invoice.voided` - marks the order of a voided invoice "not completed" (the invoice flow, section 6a).
- Copy its **signing secret** → `STRIPE_WEBHOOK_SECRET`.

## 5. Emails and renewals

**Settings → Billing → Subscriptions and emails**: turn on emails for upcoming renewals (the terms promise a reminder
before an annual plan renews) and for failed payments, and retries for failed cards. **Settings → Customer emails**: turn
on receipts for successful payments and refunds.

**Emails from your own domain.** Stripe's emails (invoices, receipts, reminders) come from a Stripe address until the
domain is added: **Settings → Business → Customer emails → Custom email domains** → add `keplerbay.com`, put the DNS
records Stripe shows in at Namecheap (Advanced DNS: one TXT for proof of ownership, CNAMEs for the mail-from domain and
DKIM, plus a `_dmarc` TXT - `v=DMARC1; p=none; rua=mailto:hq@keplerbay.com` - which Stripe requires), wait for
"Verified" (up to 72 hours), and Stripe sends from the domain. **The sender addresses are Stripe's fixed usernames on the
domain** - an invoice comes from `invoice@keplerbay.com`, a receipt from `receipts@keplerbay.com`, a reminder from
`upcoming-invoice@` / `failed-payments@` - `hq@keplerbay.com` cannot be the sender; it is the **reply-to**, as the support
email in **Settings → Public details**. Test mode sends no customer emails at all (a sandbox never does), so the emails
themselves can only be seen on the live account (a small custom invoice from the Clients tab, refunded afterwards).

## 6. Environment variables (Vercel → Settings → Environment Variables, and `.env.local`)

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_TAX_ENABLED=                # true once step 7 is done
STRIPE_TAX_CODE=                   # optional: the txcd_ code the accountant confirms
STRIPE_TOS_CONSENT=                # true for a required tick box at checkout (needs the Terms link from step 2)
PAYMENTS_PAUSED=                   # true stops new checkouts (pricing page says payments are off); the rest keeps working
PURCHASE_FLOW=                     # empty = orders are invoices emailed to the client (6a); checkout = Stripe's Checkout page
```

Remove the `PADDLE_*` variables. Redeploy after changing them.

## 6a. Orders by invoice (the default since 11-11-2026 - the owner's and the accountant's choice)

Nothing is paid on the site. "Order" on `/pricing` (and "Pay" on a paid change request) opens the order window: what is
being ordered, and who the invoice is for (name and billing address, saved on the Stripe customer). Stripe then **emails
the invoice**; the client pays it from the link in the email, on Stripe's hosted invoice page, with whatever payment
methods the account has on for invoices (**Settings → Billing → Invoices → Default payment methods**), within 7 days.
The site shows no invoices anywhere (no bell, no list on `/account`): the email is the only way to the invoice.

- A **one-time video**: paid → the seconds are added.
- A **plan**: the invoice is its first month / year. Paid → the seconds are added and the subscription starts; it sends an
  invoice every period from the next one on (it never charges a card by itself). Ordering a plan again replaces the plan
  invoice still unpaid.
- A **paid change request**: paid → the request goes to the team.

What to set in the Dashboard for it:
- **Settings → Billing → Invoices**: "Email finalized invoices to customers" on (the renewals' invoices go out by it), the
  default payment methods, the invoice numbering.
- **Settings → Billing → Subscriptions and emails → Manage invoices sent to customers**: what happens to a subscription
  whose invoice stays unpaid (cancel it after a number of days - otherwise it keeps sending invoices).
- **Settings → Customer emails**: your own sending domain, so the invoice emails come from `…@keplerbay.com` (section 5).

`PURCHASE_FLOW=checkout` brings Stripe's Checkout page back (the card is then charged on the spot and saved for renewals).

## 7. Tax and invoices - decide with the accountant first

Stripe Tax collects only where the account has an active registration (**Tax → Locations**), and with none it silently
collects nothing, so the site says "tax added at checkout" while adding none until this is done. The accountant decides:
- the tax treatment of the video work, for businesses and individuals, in Bulgaria, the EU and the US, and whether OSS applies;
- whether Stripe's invoices are enough, or a Bulgarian invoicing program is needed (Stripe's numbers are `PREFIX-0001`);
- whether card sales need a fiscal receipt or another document under Ordinance N-18.

## 7a. Invoice templates (Settings → Billing → Invoice templates)

Drafted on 08-11-2026 from the company's own invoices (0000000085 Bulgarian client, 0000000077 Fiverr / Israel,
0000000066 MindGuard / Switzerland). **The accountant still has to confirm** the number format and the legal wording.

**Numbering** (Settings → Billing → Invoices → Invoice numbering): sequentially across the account, prefix `000000`,
next sequence = the program's last number + 1. Stripe always puts a hyphen between prefix and sequence, so the numbers
read `000000-0086` - ten digits, but with a hyphen; Stripe cannot drop it.

**The supplier block** comes from Public details and is the same on every invoice: DT A I Ltd., in Latin letters.
The footer names the company in Cyrillic on the Bulgarian template (ДТ Ей Ай ООД, as in the Trade Register) and in Latin
letters on the international ones (the owner's choice, 08-11-2026). The МОЛ and the address go in the footer.

**Typed by hand, never by Claude:** the IBAN and BIC (Claude does not type bank account numbers into any field).

### Template 1 - "BG - 20% ДДС" (language: Bulgarian)
- Custom field: `Дата на данъчно събитие` = the date of the payment or the service (set per invoice).
- Custom field: `Начин на плащане` = `по банков път` (or `с карта` for a site payment).
- Memo: `Срок за плащане: 14 дни от датата на издаването на фактурата.`
- Footer: `ДТ Ей Ай ООД · ЕИК 208668338 · ДДС № BG208668338 · МОЛ: Стоян Янчев Янчев · ул. „Николай Коперник“ № 27-29,
  ет. 2, офис 17, ж.к. „Гео Милев“, 1574 София · Банка ДСК ЕАД · IBAN: [typed by hand] · BIC: STSABGSF`
- Tax: 20% Bulgarian VAT (Stripe Tax with a Bulgarian registration, or a 20% tax rate on the line).

### Template 2 - "International - 0% (чл. 21, ал. 2 ЗДДС)" (language: English, legal line in both languages)
For business clients outside Bulgaria: EU businesses with a valid VAT number (reverse charge) and clients outside the EU
(Fiverr / Israel, MindGuard / Switzerland).
- Custom field: `Date of supply / Дата на данъчно събитие` (set per invoice).
- Custom field: `VAT / ДДС` = `0% - чл. 21, ал. 2 от ЗДДС` (+ for an EU business: `Reverse charge - Art. 196 Directive 2006/112/EC`).
- Memo: `Payment within 14 days of the invoice date. Срок за плащане: 14 дни.`
- Footer: `DT A I Ltd. · UIC 208668338 · VAT BG208668338 · 27-29 Nikolay Kopernik St, floor 2, office 17,
  1574 Sofia, Bulgaria · Bank DSK · IBAN: [typed by hand] · BIC/SWIFT: STSABGSF`
- Note: the program wrote `чл.21 ал.2 от ЗДДС` on 0000000077 and `чл.21 от ЗДДС` on 0000000066 - the accountant
  should confirm that `чл. 21, ал. 2` is the one for both.

### Template 3 - "International - with VAT" (language: English)
For private individuals (no VAT number) where Bulgarian VAT applies - the accountant must say which countries / cases.
- Same as template 2, with `VAT / ДДС` = `20%` and no exemption line.

### How the site applies them (no Dashboard templates)
Stripe's templates can only be made in the Dashboard, so `lib/invoice-profiles.ts` writes the same texts onto each
**Stripe customer** (`invoice_settings.footer` / `custom_fields`, `preferred_locales`) as soon as their billing country is
known - after a checkout (the webhook), before a returning client's checkout, and before a team invoice. Bulgaria → `bg`,
a tax ID abroad → `intl_zero` (+ reverse charge in the EU), no tax ID abroad → `intl_vat`. Every later invoice for that
customer carries them, hand-made Dashboard invoices included. Business or person is chosen again on **every** checkout:
Stripe only shows "I'm purchasing as a business" to a customer with no saved tax ID, so `clearTaxIdsForCheckout` removes
the saved ones first - except while the client has a live subscription, whose renewals are taxed on that tax ID. The bank line needs `INVOICE_BANK_IBAN` (and optionally
`INVOICE_BANK_NAME`, `INVOICE_BANK_BIC`) in `.env.local` and Vercel - typed by the owner, never in the code.

### Tax code - General services (video production; owner's decision 08-11-2026, accountant to confirm)
Tax → Settings → default tax code `txcd_20030000` (General - Services), tax-exclusive prices, a Bulgarian registration
(standard, `small_seller`). Stripe then charges 20% to every person (Bulgaria, the EU and outside it) and to Bulgarian
companies, and nothing to a company abroad that gives its tax ID (EU reverse charge, or outside the EU). A company in a
country with no tax ID field at checkout (the US) is taxed as a person. Set in the sandbox; the live account needs the
same three settings.

### Not in Stripe's invoices (the program has them)
- `Словом` (the total in words) - Stripe has no such field; the site could fill a custom field, but only four exist.
- `Получател` / `Съставил` lines - ask the accountant whether they are still needed.

## 8. Test (test mode)

1. Order the Personal video on `/en/pricing`: the order window asks who the invoice is for and sends it. Stripe sends
   no emails in test mode - open the invoice in the Dashboard (**Invoices**), copy the hosted invoice page's link from it,
   open that link and pay with card `4242 4242 4242 4242`, any future date, any CVC. (The site itself never lists or
   links the invoices: a client has them in email only.)
2. The seconds appear on Your Projects; the order on `/account` reads paid, with an invoice.
3. Order a subscription and pay its invoice → it shows on `/account`; cancel → "active until …"; resume.
   (With `PURCHASE_FLOW=checkout`, steps 1-3 go through Stripe's Checkout page instead.)
4. From the admin dashboard → Clients → a client → Invoices, send a custom invoice; it arrives by email from Stripe.

To test on your computer, forward the webhook with the Stripe CLI:
`stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired,invoice.paid,invoice.voided,invoice.payment_failed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted --forward-to localhost:3000/api/stripe/webhook`.

Refunds are made in Stripe (**Payments → a payment → Refund**), including a declined paid change request. The video time is
taken back with an adjustment in the Clients tab.
