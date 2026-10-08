-- Every purchase as an order: who bought what - one-time video or subscription, which plan, which billing, how many
-- seconds, for how much - and whether it was paid. Written by /api/checkout (pending) and the payment webhook (paid /
-- failed / expired), both with the service role; clients read their own, the team reads all.
-- Run once in the Supabase SQL Editor, AFTER profiles.sql (setup-all.sql includes it). Safe to re-run.

create table if not exists public.orders (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.profiles (id) on delete cascade,
  plan_key                text not null,                                 -- personal, creator, pro, local, brand
  purchase_type           text not null check (purchase_type in ('one_time', 'subscription')),
  billing                 text check (billing in ('monthly', 'annual')),   -- subscriptions only
  seconds                 integer not null check (seconds > 0),          -- per payment (a year of them on annual)
  amount_cents            integer not null check (amount_cents >= 0),
  currency                text not null default 'usd',
  status                  text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'expired')),
  stripe_session_id       text unique,
  stripe_subscription_id  text,
  created_at              timestamptz not null default now(),
  paid_at                 timestamptz
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_subscription_idx on public.orders (stripe_subscription_id);

alter table public.orders enable row level security;

drop policy if exists "Read your own orders" on public.orders;
create policy "Read your own orders"
  on public.orders for select to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());

revoke insert, update, delete on public.orders from authenticated, anon;

-- Each credit points at the order that paid for it (a subscription's renewals all point at its order).
alter table public.credit_ledger add column if not exists order_id uuid references public.orders (id) on delete set null;
create index if not exists credit_ledger_order_idx on public.credit_ledger (order_id);

-- The plan as bought: monthly or annual, and the price per period (from the subscription item, mirrored by the webhook).
alter table public.subscriptions add column if not exists billing text check (billing in ('monthly', 'annual'));
alter table public.subscriptions add column if not exists amount_cents integer;
alter table public.subscriptions add column if not exists currency text;
