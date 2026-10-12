# Setting up accounts, packs, projects and the team dashboard

The whole flow: a client signs up → buys a pack (their video seconds are added) → submits a project (the seconds are spent,
we get everything they filled in and their files) → we work on it in the team dashboard → client and team talk in the
project's comments → we upload the finished video and files (private Storage) and set the stage to **In review** → the
client approves it (→ Delivered) or requests a revision (→ back In production, one included revision used).

## 1. Supabase (the database and the sign-in)

**Easiest:** run the single file `setup-all.sql` (it is the nine files below in the right order) - one query, one Run.
Already set up from an earlier version? Run the files you are missing on their own, in order (all are safe to re-run).

> **The live project ("US WEBSITE", `zwhcvnqqdbqlxqtwurnw`) has all nine applied** as of 08-10-2026 (`delivery`,
> `profiles`, the `hardening` block, `orders`, `hardening.sql`, `approval.sql` and `changes.sql` went in as Supabase migrations).

Or, in the Supabase dashboard → **SQL Editor** → **New query**, run these files **in this order**, one query each:

1. `projects.sql` - the projects table
2. `team.sql` - the team role, client files storage, team access
3. `credits.sql` - video seconds, "submit a project", comments
4. `delivery.sql` - the private `project-deliveries` bucket for finished work, the client's approve / revision action,
   `updated_at` kept by a trigger, and the `subscriptions` mirror (one live plan per client)
5. `profiles.sql` - **one `profiles` row per user** (same id as the sign-in account, created at sign-up by a trigger,
   backfilled for existing users): name, company, phone, country, Paddle customer id. `projects`, `credit_ledger`,
   `project_comments` and `subscriptions` now point at it. Also the team's private `client_notes`, the
   `client_overview` view the team's Clients tab reads, and the security hardening the Supabase advisors asked for

6. `orders.sql` - **every purchase as an order**: who bought what - one-time video or subscription, the plan, the
   billing, the seconds, the amount - and its status (pending -> paid / failed / expired). `/api/checkout` writes it
   pending, the webhook settles it, and each credit in `credit_ledger` points at its order (`order_id`)
7. `hardening.sql` - **least privilege**: signed-out visitors touch no table, only the server writes subscriptions and
   orders, the ledger and comments are append-only, no TRUNCATE for the API roles, the helper functions are not
   callable, and `submit_project()` bounds every field and accepts only files in the client's own folder for that
   project. A new table gets Supabase's default grants back - repeat the matching revokes for it
8. `approval.sql` - **approval is final**: `client_project_action()` refuses anything on an approved project
   (`already_approved`), a revision request sends the film back to production, and a trigger keeps an approved project
   at Delivered (`project_approved`) - to reopen one on purpose, clear `approved_at` in the same update
9. `changes.sql` - **change requests and reviews**: `project_requests` (deadline: $50 a day sooner, later free, never
   sooner than 2 days out; length: seconds from the balance, missing ones bought at $11.90 a second, up to a 10-minute film;
   format (9:16, 16:9, 4:3, 3:4, 1:1, 21:9): the film's length in seconds, bought alike; revision: $49) through `request_project_change()` (prices worked out there), paid ones
   settled by the webhook, answered by the team with `resolve_project_request()` (approve applies it, decline gives seconds
   back), withdrawn with `cancel_project_request()`; and `project_reviews` (quality / speed / attitude 1-5 + a comment,
   only on your own approved project)

To give a client video time by hand (a gift, a test account), add a ledger row - never edit a balance:

```sql
insert into public.credit_ledger (user_id, seconds, kind, note)
select id, 3600, 'adjustment', 'Why it was added' from public.profiles where email = 'client@example.com';
```

(or open the client in the team dashboard's **Clients** tab and use Add / Take back).

Then make yourself (and each colleague) a team member - see the snippet at the top of `team.sql`, then sign out and in again.

Also in Supabase:
- **Authentication → URL Configuration → Redirect URLs**: add `http://localhost:3000/**` and your live site + `/**`.
- **Authentication → Providers**: switch on Google (and Microsoft/Azure if wanted). Email works out of the box.
- **Project Settings → API**: copy the **service_role** key (secret!) for step 3 below.
- **Project Settings → Storage → Upload file size limit**: 50 MB on the free plan. Finished films are often bigger - on a
  paid plan raise it (e.g. 2 GB), or the team's video upload fails with a size error.

## 2. Paddle (taking payment for packs)

Payments run on **Paddle Billing**. Paddle is the **merchant of record**: it sells to the client, collects and remits
sales tax / VAT, issues every invoice and receipt, and pays out to DT A I. The step-by-step account setup is in
`PADDLE_SETUP.md` at the repo root; in short:

1. A **sandbox** account first (sandbox-vendors.paddle.com), then the live one once Paddle has approved the business
   and the domain.
2. **Developer tools → Authentication**: an **API key** (server - `PADDLE_API_KEY`) and a **client-side token**
   (browser - `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`).
3. **Checkout → Checkout settings**: the **default payment link** = `https://YOUR-SITE/en/pricing` (Paddle requires one;
   the checkout opens there as an overlay), and **Website approval** for the domain.
4. **Developer tools → Notifications → New destination**:
   - URL: `https://YOUR-SITE/api/paddle/webhook`
   - Events: `transaction.completed`, `transaction.canceled`, `transaction.payment_failed`, and
     `subscription.created`, `subscription.updated`, `subscription.activated`, `subscription.canceled`,
     `subscription.past_due`, `subscription.paused`, `subscription.resumed`, `subscription.trialing`
   - Seconds are added **only for money collected** - on `transaction.completed` (a one-time pack, a subscription's
     first payment and every renewal; `src/lib/paddle-credits.ts`). A failed renewal never completes; Paddle retries
     it and emails the client itself, and the subscription turns `past_due` - the admin dashboard's red alert.
   - Copy the destination's **secret key** (`PADDLE_WEBHOOK_SECRET`).
5. To test on your computer, Paddle cannot reach `localhost`: use a tunnel (e.g. `ngrok http 3000`) as the destination
   URL, or Paddle's **Notifications → Simulations**. Sandbox test card: `4242 4242 4242 4242`, any future date, CVC `100`.
6. Run `supabase/paddle.sql` (the `paddle_*` id columns) on any database set up before October 2026.

## 2b. Invoices and tax

Paddle is the seller on every online order, so the invoice is **Paddle's** (Paddle.com as reseller, your business named
on it): its numbering, tax lines and the client's tax ID are Paddle's job. What the site does: every checkout uses the
client's one Paddle customer (`profiles.paddle_customer_id`, `src/lib/paddle-customers.ts`); prices are quoted before
tax and Paddle adds the tax from the client's address at checkout; `/account` lists every invoice (a transaction) with
its tax and a PDF link (`/api/invoices/[id]/pdf` - Paddle's own links expire); and the team bills a **custom quote**
from the Clients tab → client → Invoices (`/api/team/invoices`) - a manually collected Paddle invoice that Paddle
emails, payable through its checkout link. Paddle needs a **billing address** on every such invoice.

The video work's **tax category** is `standard` unless `PADDLE_TAX_CATEGORY` names another one Paddle has enabled on
the account (ask Paddle support whether AI video production should be `professional-services`).

Your own books: Paddle pays out the net amount; ask your accountant how DT A I records Paddle's payouts (a reseller's
payout, not a sale to each client).

## 3. Environment variables

In `.env.local` (your computer) **and** in Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # secret - server only, never NEXT_PUBLIC
PADDLE_API_KEY=pdl_sdbx_apikey_...      # secret - server only
PADDLE_WEBHOOK_SECRET=pdl_ntfset_...    # the notification destination's secret key
PADDLE_ENVIRONMENT=sandbox              # production once the live account is approved
PADDLE_TAX_CATEGORY=                    # optional: a tax category Paddle enabled for you (else standard)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_...  # the client-side token (safe in the browser)
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox    # must match PADDLE_ENVIRONMENT
RESEND_API_KEY=...                 # project emails: the client hears every step, the team every client action
TEAM_NOTIFY_EMAIL=                 # optional: where admin emails go (default info@dreamteamvideo.com while testing)
```

Without the Paddle keys the pack buttons say payments aren't on yet; without the service key a paid purchase can't be
credited (Paddle will keep retrying). You can always add or take back seconds by hand in the team dashboard.

## 4. Try it without any data

- `/en/my-projects?sample=1` - the client's Your Projects with made-up projects (any signed-in account)
- `/en/team?sample=1` - the team dashboard with made-up data (any signed-in account)

## Testing without payments (no Paddle)

1. Run the three SQL files (section 1) and make yourself a team member.
2. Use **two accounts**: your team account (admin) and a normal **client** account (a different email). An admin account is
   the team's - its comments are marked "Team".
3. Give the client video time by hand: edit and run `grant-test-credits.sql` (the client's email, the seconds).
4. Sign in as the client → **Your Projects** → **Submit a project** → fill the form (attach a file too) → Submit.
5. Sign in as the team account → account menu → **Team dashboard**: the project is there with everything the client filled
   in and their files; write a comment, change the stage, save. The client sees it at once in **Your Projects**.

Paddle and `SUPABASE_SERVICE_ROLE_KEY` are not needed for this; the pack buttons on the Pricing page will say payments
aren't switched on yet.
