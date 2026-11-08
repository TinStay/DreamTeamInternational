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

### Tax code - Advertising Services (owner's decision, 08-11-2026, accountant to confirm)
Tax → Settings → default tax code `txcd_20060002` (Advertising Services), tax-exclusive prices, a Bulgarian registration
(standard, `small_seller`). Stripe then charges 20% in Bulgaria and to EU persons, reverses it for an EU business with a
VAT number, and charges nothing to anyone outside the EU - business or person (чл. 21, ал. 5 ЗДДС / Art. 59 of the VAT
Directive). Set in the sandbox; the live account needs the same three settings.

### Not in Stripe's invoices (the program has them)
- `Словом` (the total in words) - Stripe has no such field; the site could fill a custom field, but only four exist.
- `Получател` / `Съставил` lines - ask the accountant whether they are still needed.

## 8. Test (test mode)

1. Buy the Personal video on `/en/pricing` - card `4242 4242 4242 4242`, any future date, any CVC.
2. You land on Your Projects and the seconds appear; the order on `/account` reads paid, with an invoice.
3. Buy a subscription → it shows on `/account`; cancel → "active until …"; resume.
4. From the admin dashboard → Clients → a client → Invoices, send a custom invoice; it arrives by email from Stripe.

To test on your computer, forward the webhook with the Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

Refunds are made in Stripe (**Payments → a payment → Refund**), including a declined paid change request. The video time is
taken back with an adjustment in the Clients tab.
