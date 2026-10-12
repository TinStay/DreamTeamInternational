-- PADDLE: the payment ids Paddle Billing gives us (the site moved from Stripe to Paddle in October 2026).
-- Run once in the Supabase SQL Editor (after the other files; setup-all.sql includes it). Safe to run again.
-- The old stripe_* columns stay: they keep the ids of anything bought before the move.

-- The client's one Paddle customer (ctm_...), set on first checkout and by the subscription webhook.
alter table public.profiles add column if not exists paddle_customer_id text;
create index if not exists profiles_paddle_customer_idx on public.profiles (paddle_customer_id);

-- Each checkout's Paddle transaction (txn_...) and, for a plan, the subscription it created (sub_...).
alter table public.orders add column if not exists paddle_transaction_id text unique;
alter table public.orders add column if not exists paddle_subscription_id text;
create index if not exists orders_paddle_subscription_idx on public.orders (paddle_subscription_id);

-- A paid change request's Paddle transaction.
alter table public.project_requests add column if not exists paddle_transaction_id text;

-- No new grants: profiles / orders / project_requests keep their table grants (profiles.sql, orders.sql, changes.sql) -
-- clients read their own rows, and only the server (service role) writes these columns.
