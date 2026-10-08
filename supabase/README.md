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
   backfilled for existing users): name, company, phone, country, Stripe customer id. `projects`, `credit_ledger`,
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

## 2. Stripe (taking payment for packs)

1. Create a Stripe account (stripe.com) and stay in **test mode** at first.
2. **Developers → API keys**: copy the **Secret key** (`sk_test_…`).
3. **Developers → Webhooks → Add endpoint**:
   - URL: `https://YOUR-SITE/api/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`, `checkout.session.expired` (the last two settle an order as failed /
     not completed), `invoice.paid`,
     `customer.subscription.created`, `customer.subscription.updated` and `customer.subscription.deleted` (the last three
     keep a client from buying a second plan while one is live)
   - Seconds are added **only for money collected**: a declined card never completes the checkout, a bank payment
     (ACH / SEPA) completes it as unpaid and is credited only when `async_payment_succeeded` arrives, and a failed
     subscription payment sends `invoice.payment_failed`, never `invoice.paid` (`src/lib/stripe-credits.ts`). To tell
     clients about a failed renewal, turn on Stripe's own emails: **Settings → Billing → Subscriptions and emails →
     failed payments**.
   - Copy the **Signing secret** (`whsec_…`).
4. To test on your computer, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   (it prints a `whsec_…` for local use). Test card: `4242 4242 4242 4242`, any future date, any CVC.

## 3. Environment variables

In `.env.local` (your computer) **and** in Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # secret - server only, never NEXT_PUBLIC
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=...                 # emails to the team when a project is submitted
```

Without the Stripe keys the pack buttons say payments aren't on yet; without the service key a paid purchase can't be
credited (Stripe will keep retrying). You can always add or take back seconds by hand in the team dashboard.

## 4. Try it without any data

- `/en/my-projects?sample=1` - the client's Your Projects with made-up projects (any signed-in account)
- `/en/team?sample=1` - the team dashboard with made-up data (any signed-in account)

## Testing without payments (no Stripe)

1. Run the three SQL files (section 1) and make yourself a team member.
2. Use **two accounts**: your team account (admin) and a normal **client** account (a different email). An admin account is
   the team's - its comments are marked "Team".
3. Give the client video time by hand: edit and run `grant-test-credits.sql` (the client's email, the seconds).
4. Sign in as the client → **Your Projects** → **Submit a project** → fill the form (attach a file too) → Submit.
5. Sign in as the team account → account menu → **Team dashboard**: the project is there with everything the client filled
   in and their files; write a comment, change the stage, save. The client sees it at once in **Your Projects**.

Stripe and `SUPABASE_SERVICE_ROLE_KEY` are not needed for this; the pack buttons on the Pricing page will say payments
aren't switched on yet.
