# Setting up accounts, packs, projects and the team dashboard

The whole flow: a client signs up → buys a pack (their video seconds are added) → submits a project (the seconds are spent,
we get everything they filled in and their files) → we work on it in the team dashboard → client and team talk in the
project's comments.

## 1. Supabase (the database and the sign-in)

**Easiest:** run the single file `setup-all.sql` (it is the three files below in the right order) - one query, one Run.

Or, in the Supabase dashboard → **SQL Editor** → **New query**, run these files **in this order**, one query each:

1. `projects.sql` - the projects table
2. `team.sql` - the team role, client files storage, team access
3. `credits.sql` - video seconds, "submit a project", comments

Then make yourself (and each colleague) a team member - see the snippet at the top of `team.sql`, then sign out and in again.

Also in Supabase:
- **Authentication → URL Configuration → Redirect URLs**: add `http://localhost:3000/**` and your live site + `/**`.
- **Authentication → Providers**: switch on Google (and Microsoft/Azure if wanted). Email works out of the box.
- **Project Settings → API**: copy the **service_role** key (secret!) for step 3 below.

## 2. Stripe (taking payment for packs)

1. Create a Stripe account (stripe.com) and stay in **test mode** at first.
2. **Developers → API keys**: copy the **Secret key** (`sk_test_…`).
3. **Developers → Webhooks → Add endpoint**:
   - URL: `https://YOUR-SITE/api/stripe/webhook`
   - Events: `checkout.session.completed` and `invoice.paid`
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
