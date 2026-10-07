-- One row per user: the client's profile, the hub every piece of their data points at, plus the team's private notes and
-- the one-query overview the team's Clients tab reads.
-- Run once in the Supabase SQL Editor, AFTER projects.sql, team.sql, credits.sql and delivery.sql (setup-all.sql includes
-- it). Safe to re-run. Existing users get their profile backfilled; existing projects, credits and comments stay intact.

-- 1) The profile. Its id IS the sign-in account's id (auth.users.id), so nothing ever has to be matched up.
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  email               text,
  full_name           text,
  company             text,
  phone               text,
  country             text,
  stripe_customer_id  text,                                -- set by the payment webhook
  is_team             boolean not null default false,      -- mirrors app_metadata.role = 'admin'
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- updated_at follows every change (the same helper delivery.sql defines; repeated so this file stands alone).
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- 2) A profile is created the moment someone signs up, and follows their email and team role afterwards.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, is_team)
  values (
    new.id,
    new.email,
    nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), ''),
    coalesce(new.raw_app_meta_data ->> 'role', '') = 'admin'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set email = new.email,
         is_team = coalesce(new.raw_app_meta_data ->> 'role', '') = 'admin',
         -- A name from Google / Microsoft fills an empty one, never overwrites what the client typed.
         full_name = coalesce(full_name, nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), ''))
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, raw_app_meta_data, raw_user_meta_data on auth.users
  for each row execute function public.handle_user_updated();

-- Everyone who signed up before this file: a profile each.
insert into public.profiles (id, email, full_name, is_team, created_at)
select u.id,
       u.email,
       nullif(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'), ''),
       coalesce(u.raw_app_meta_data ->> 'role', '') = 'admin',
       u.created_at
  from auth.users u
on conflict (id) do nothing;

-- 3) Who may read and change a profile: the client their own, the team all. Only the contact fields can be edited -
--    the email follows the sign-in account, stripe_customer_id the webhook (service role), is_team the role.
alter table public.profiles enable row level security;

drop policy if exists "Read your own profile" on public.profiles;
create policy "Read your own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Update your own profile" on public.profiles;
create policy "Update your own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, company, phone, country) on public.profiles to authenticated;

-- 4) Every piece of a client's data now points at their profile (it used to point at auth.users directly, which the
--    API cannot join through). Deleting the sign-in account still deletes everything: auth.users -> profiles -> the rest.
alter table public.projects drop constraint if exists projects_user_id_fkey;
alter table public.projects
  add constraint projects_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.credit_ledger drop constraint if exists credit_ledger_user_id_fkey;
alter table public.credit_ledger
  add constraint credit_ledger_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.project_comments drop constraint if exists project_comments_user_id_fkey;
alter table public.project_comments
  add constraint project_comments_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.subscriptions drop constraint if exists subscriptions_user_id_fkey;
alter table public.subscriptions
  add constraint subscriptions_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade;

-- 5) The team's private notes about a client - never visible to the client.
create table if not exists public.client_notes (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.profiles (id) on delete cascade,
  author_id    uuid references public.profiles (id) on delete set null,
  author_name  text,
  body         text not null check (char_length(body) between 1 and 4000),
  created_at   timestamptz not null default now()
);
create index if not exists client_notes_client_idx on public.client_notes (client_id, created_at desc);

alter table public.client_notes enable row level security;

drop policy if exists "Team reads client notes" on public.client_notes;
create policy "Team reads client notes"
  on public.client_notes for select to authenticated
  using (public.is_admin());

drop policy if exists "Team writes client notes" on public.client_notes;
create policy "Team writes client notes"
  on public.client_notes for insert to authenticated
  with check (public.is_admin() and author_id = auth.uid());

drop policy if exists "Team deletes client notes" on public.client_notes;
create policy "Team deletes client notes"
  on public.client_notes for delete to authenticated
  using (public.is_admin());

-- 6) One row per client for the team's Clients tab: the profile with the balance, projects, plan and last activity.
--    security_invoker: the view runs with the reader's own rights, so row level security still decides what they see
--    (the team everything, a client only their own row).
create or replace view public.client_overview
with (security_invoker = true)
as
select
  p.id,
  p.email,
  p.full_name,
  p.company,
  p.phone,
  p.country,
  p.is_team,
  p.created_at,
  coalesce((select sum(l.seconds) from public.credit_ledger l where l.user_id = p.id), 0)::integer as balance_seconds,
  (select count(*) from public.projects pr where pr.user_id = p.id)::integer as project_count,
  (select count(*) from public.projects pr where pr.user_id = p.id and pr.status <> 'delivered')::integer as open_projects,
  (select s.plan_key from public.subscriptions s
     where s.user_id = p.id and s.status in ('active', 'trialing', 'past_due', 'unpaid')
     order by s.updated_at desc limit 1) as plan_key,
  (select s.status from public.subscriptions s where s.user_id = p.id order by s.updated_at desc limit 1) as subscription_status,
  greatest(
    p.updated_at,
    (select max(l.created_at) from public.credit_ledger l where l.user_id = p.id),
    (select max(pr.updated_at) from public.projects pr where pr.user_id = p.id),
    (select max(c.created_at) from public.project_comments c where c.user_id = p.id)
  ) as last_activity
from public.profiles p;

grant select on public.client_overview to authenticated;

-- 7) Hardening (from the Supabase advisors): trigger functions are never called through the API, the client RPCs are
--    for signed-in users only, fixed search_paths, and indexes for the foreign keys.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_updated() from public, anon, authenticated;
revoke execute on function public.client_project_action(uuid, text, text) from anon;
revoke execute on function public.submit_project(uuid, text, text, text, text, integer, date, jsonb, text, jsonb, text, text) from anon;
alter function public.is_admin() set search_path = public;
alter function public.touch_updated_at() set search_path = public;
create index if not exists client_notes_author_idx on public.client_notes (author_id);
create index if not exists credit_ledger_project_idx on public.credit_ledger (project_id);
create index if not exists project_comments_user_idx on public.project_comments (user_id);
