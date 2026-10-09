-- ONE-FILE SETUP: projects + team + credits + delivery + profiles + orders + hardening + approval + changes, in the right order. Run this once in the Supabase SQL Editor.
-- (Same content as projects.sql, then team.sql, then credits.sql, then delivery.sql, then profiles.sql, then orders.sql, then hardening.sql, then approval.sql, then changes.sql. After it, make yourself an admin - see the snippet
-- inside the team.sql part below, and read README.md.)

-- ======================= 1/6  projects =======================
-- The client's projects for the "Your Projects" page (/en/my-projects).
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Clients can only READ their own rows (row level security); you add and update projects from the dashboard
-- (Table Editor -> projects) or from your own admin tooling with the service role.

create table if not exists public.projects (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  title             text not null,
  kind              text not null default 'AI video',        -- e.g. 'Social Media Ad', 'TV Ad', 'Corporate Video'
  status            text not null default 'brief'
                    check (status in ('brief', 'scripting', 'production', 'review', 'delivered')),
  brief             text,                                     -- what the client asked for
  thumbnail_url     text,                                     -- optional poster image (https URL)
  video_id          text,                                     -- Bunny Stream video id, once there is a film to watch
  duration_seconds  integer,                                  -- length of the finished video
  due_date          date,
  revisions_total   integer not null default 2,
  revisions_used    integer not null default 0,
  -- Optional custom timeline: [{"title":"Script approved","date":"2026-10-02","note":"...","done":true}, ...].
  -- Leave it empty and the page shows the five standard stages for the status.
  timeline          jsonb not null default '[]'::jsonb,
  format            text,                                     -- e.g. '9:16 vertical', '16:9', '1:1'
  manager_name      text,                                     -- the producer looking after this project
  next_step         text,                                     -- what happens next / what we need from the client
  -- What the client filled in when ordering: [{"label":"Audience","value":"Women 25-40"}, ...]
  brief_answers     jsonb not null default '[]'::jsonb,
  -- Finished files to download: [{"name":"Summer-Sale-9x16.mp4","url":"https://...","size":"18 MB"}, ...]
  files             jsonb not null default '[]'::jsonb,
  -- Revision requests so far: [{"title":"Bigger logo at the end","date":"2026-10-02","done":true}, ...]
  revisions         jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id, created_at desc);

alter table public.projects enable row level security;

drop policy if exists "Clients read their own projects" on public.projects;
create policy "Clients read their own projects"
  on public.projects for select
  to authenticated
  using (auth.uid() = user_id);

-- Already ran an earlier version of this file? These add the newer columns to the existing table (safe to re-run).
alter table public.projects add column if not exists format text;
alter table public.projects add column if not exists manager_name text;
alter table public.projects add column if not exists next_step text;
alter table public.projects add column if not exists brief_answers jsonb not null default '[]'::jsonb;
alter table public.projects add column if not exists files jsonb not null default '[]'::jsonb;
alter table public.projects add column if not exists revisions jsonb not null default '[]'::jsonb;

-- Clients do not insert into this table directly: a project is created (and its video seconds are spent) in one step by
-- the submit_project() function in supabase/credits.sql.

-- ======================= 2/6  team =======================
-- The team dashboard (/en/team): every client's projects and the files they submitted, in one place.
-- Run this once in the Supabase dashboard (SQL Editor), AFTER supabase/projects.sql.

-- 1) Who is on the team: an account whose app_metadata has  {"role": "admin"}.
--    Make yourself (and colleagues) admin - change the email, run, then SIGN OUT AND IN again on the site:
--
--    update auth.users
--       set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
--     where email = 'you@example.com';
--
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

-- 2) What a submitted project also carries: who sent it, and the files they attached (kept in Storage, see below).
alter table public.projects add column if not exists client_name  text;
alter table public.projects add column if not exists client_email text;
-- [{"name":"script.pdf","path":"<user id>/<project id>/script.pdf","size":123456}, ...]
alter table public.projects add column if not exists brief_files  jsonb not null default '[]'::jsonb;

-- 3) The team sees and updates every project.
drop policy if exists "Team reads all projects" on public.projects;
create policy "Team reads all projects"
  on public.projects for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Team updates all projects" on public.projects;
create policy "Team updates all projects"
  on public.projects for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 4) A private place for the clients' files. Each client can add to and read their own folder; the team reads everything.
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

drop policy if exists "Clients upload to their own folder" on storage.objects;
create policy "Clients upload to their own folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Clients read their own files" on storage.objects;
create policy "Clients read their own files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Team reads all project files" on storage.objects;
create policy "Team reads all project files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'project-files' and public.is_admin());

-- ======================= 3/6  credits =======================
-- Video seconds ("credits"), submitting a project, and the comments on it.
-- Run once in the Supabase SQL Editor, AFTER supabase/projects.sql and supabase/team.sql.

-- 1) The ledger: every change to a client's video seconds is one row. Buying a pack adds, submitting a project spends
--    (negative), the team can add or take back (adjustments). The balance is the sum - it can never be edited away.
create table if not exists public.credit_ledger (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  seconds      integer not null,                                   -- + adds, - spends
  kind         text not null check (kind in ('purchase', 'spend', 'refund', 'adjustment')),
  plan_key     text,                                               -- which pack (personal, creator, pro, local, brand, enterprise)
  project_id   uuid references public.projects (id) on delete set null,
  note         text,
  external_ref text unique,                                        -- the payment's id, so one payment is only ever credited once
  created_at   timestamptz not null default now()
);
create index if not exists credit_ledger_user_idx on public.credit_ledger (user_id, created_at desc);

alter table public.credit_ledger enable row level security;

drop policy if exists "Clients read their own ledger" on public.credit_ledger;
create policy "Clients read their own ledger"
  on public.credit_ledger for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Team reads the whole ledger" on public.credit_ledger;
create policy "Team reads the whole ledger"
  on public.credit_ledger for select to authenticated
  using (public.is_admin());

-- The team adds or takes back seconds by hand (a custom pack, a refund, a gift). Purchases come from the payment webhook,
-- which uses the service role, and spending happens inside submit_project() below - clients can never insert here.
drop policy if exists "Team adjusts credits" on public.credit_ledger;
create policy "Team adjusts credits"
  on public.credit_ledger for insert to authenticated
  with check (public.is_admin() and kind in ('adjustment', 'refund'));

-- 2) Submitting a project: checks the balance, creates the project and spends the seconds - all or nothing.
revoke insert on public.projects from authenticated;
drop policy if exists "Clients create their own projects" on public.projects;

create or replace function public.submit_project(
  p_id uuid,
  p_title text,
  p_kind text,
  p_brief text,
  p_format text,
  p_duration integer,
  p_due date,
  p_answers jsonb,
  p_next_step text,
  p_files jsonb,
  p_client_name text,
  p_client_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  balance integer;
  created public.projects;
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  if p_duration is null or p_duration <= 0 then
    raise exception 'invalid_duration';
  end if;

  -- One submission at a time per client, so two tabs cannot spend the same seconds twice.
  perform pg_advisory_xact_lock(hashtext(uid::text));

  select coalesce(sum(seconds), 0) into balance from public.credit_ledger where user_id = uid;
  if balance < p_duration then
    raise exception 'insufficient_credits';
  end if;

  insert into public.projects (id, user_id, title, kind, status, brief, format, duration_seconds, due_date, brief_answers, next_step, brief_files, client_name, client_email)
  values (p_id, uid, p_title, p_kind, 'brief', p_brief, p_format, p_duration, p_due, coalesce(p_answers, '[]'::jsonb), p_next_step, coalesce(p_files, '[]'::jsonb), p_client_name, p_client_email)
  returning * into created;

  insert into public.credit_ledger (user_id, seconds, kind, project_id, note)
  values (uid, -p_duration, 'spend', created.id, p_title);

  return to_jsonb(created);
end;
$$;

revoke all on function public.submit_project(uuid, text, text, text, text, integer, date, jsonb, text, jsonb, text, text) from public;
grant execute on function public.submit_project(uuid, text, text, text, text, integer, date, jsonb, text, jsonb, text, text) to authenticated;

-- 3) Comments on a project - a plain thread the client and the team both write in (not a chat).
create table if not exists public.project_comments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  author_name text,
  is_team     boolean not null default false,
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);
create index if not exists project_comments_project_idx on public.project_comments (project_id, created_at);

alter table public.project_comments enable row level security;

drop policy if exists "Read comments of your projects" on public.project_comments;
create policy "Read comments of your projects"
  on public.project_comments for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

drop policy if exists "Write comments on your projects" on public.project_comments;
create policy "Write comments on your projects"
  on public.project_comments for insert to authenticated
  with check (
    user_id = auth.uid()
    and is_team = public.is_admin()
    and (
      public.is_admin()
      or exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
    )
  );

-- ======================= 4/6  delivery =======================
-- Delivering the work, the client's approval / revision request, and the one-subscription rule.
-- Run once in the Supabase SQL Editor, AFTER projects.sql, team.sql and credits.sql (setup-all.sql includes it). Safe to re-run.

-- 1) What a delivery carries.
--    delivery_video: the finished film, kept in the private Storage bucket below - {"name","path","size","type"}.
--    files:          the deliverables to download - new entries are {"name","path","size"} in that bucket
--                    (older rows may still hold {"name","url","size"} - the site reads both).
--    approved_at:    when the client approved the video.
alter table public.projects add column if not exists delivery_video jsonb;
alter table public.projects add column if not exists approved_at timestamptz;

-- 2) updated_at follows every change by itself (the site no longer has to send it).
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.touch_updated_at();

-- 3) A private bucket for the finished work, at  <client user id>/<project id>/<file>.
--    Only the team uploads, replaces and removes; each client reads their own folder (through short-lived signed links),
--    so a delivered film is never public.
--    The upload size is capped by the project's global limit (Project Settings -> Storage: 50 MB on the free plan) -
--    raise it for long 4K films.
insert into storage.buckets (id, name, public)
values ('project-deliveries', 'project-deliveries', false)
on conflict (id) do nothing;

drop policy if exists "Team manages deliveries" on storage.objects;
create policy "Team manages deliveries"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'project-deliveries' and public.is_admin())
  with check (bucket_id = 'project-deliveries' and public.is_admin());

drop policy if exists "Clients read their own deliveries" on storage.objects;
create policy "Clients read their own deliveries"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'project-deliveries' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4) The client's answer to a video in review: approve it (-> Delivered) or ask for a revision (-> back In production,
--    one of the included revisions used, the request added to the project's revision history). Clients still cannot
--    update the table directly - this function is the only door, and it only opens on their own project in review.
create or replace function public.client_project_action(p_id uuid, p_action text, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  proj public.projects;
  note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;

  select * into proj from public.projects where id = p_id and user_id = uid for update;
  if not found then
    raise exception 'not_found';
  end if;
  -- In review: approve or ask for a revision. Being reworked after a revision: the client may still approve the version
  -- they have (they changed their mind), but not ask for another revision.
  if proj.status <> 'review' and not (p_action = 'approve' and proj.status = 'production' and proj.revisions_used > 0) then
    raise exception 'not_in_review';
  end if;

  if p_action = 'approve' then
    update public.projects
       set status = 'delivered', approved_at = now(), next_step = null
     where id = p_id
    returning * into proj;
  elsif p_action = 'revision' then
    if note is null then
      raise exception 'note_required';
    end if;
    if proj.revisions_used >= proj.revisions_total then
      raise exception 'no_revisions_left';
    end if;
    update public.projects
       set status = 'production',
           revisions_used = revisions_used + 1,
           revisions = coalesce(revisions, '[]'::jsonb)
                       || jsonb_build_array(jsonb_build_object('title', left(note, 2000), 'date', current_date, 'done', false)),
           next_step = null
     where id = p_id
    returning * into proj;
  else
    raise exception 'invalid_action';
  end if;

  return to_jsonb(proj);
end;
$$;

revoke all on function public.client_project_action(uuid, text, text) from public;
grant execute on function public.client_project_action(uuid, text, text) to authenticated;

-- 5) Subscriptions, mirrored from Stripe by the payment webhook (service role), so a client with a live plan is not
--    sold a second one. Clients read their own; the team reads all; nobody writes here but the webhook.
create table if not exists public.subscriptions (
  id                    text primary key,                                  -- Stripe subscription id (sub_...)
  user_id               uuid not null references auth.users (id) on delete cascade,
  customer_id           text,                                              -- Stripe customer id (cus_...)
  plan_key              text,
  status                text not null,                                     -- Stripe's: active, trialing, past_due, canceled, ...
  current_period_end    timestamptz,
  cancel_at_period_end  boolean not null default false,
  updated_at            timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

drop policy if exists "Clients read their own subscriptions" on public.subscriptions;
create policy "Clients read their own subscriptions"
  on public.subscriptions for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Team reads all subscriptions" on public.subscriptions;
create policy "Team reads all subscriptions"
  on public.subscriptions for select to authenticated
  using (public.is_admin());

-- ======================= 5/6  profiles =======================
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

-- ======================= 6/6  orders =======================
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

-- ======================= 7/7  hardening =======================
-- SECURITY HARDENING (7/9). Run once in the Supabase SQL Editor, AFTER every other file (safe to re-run).
--
-- Row level security already decides which rows a client sees; this file takes away the table privileges nobody uses,
-- so a missing or mistaken policy can never open a table by accident:
--   * signed-out visitors (`anon`) touch no table at all - every page with data needs an account;
--   * nobody but the service role (the webhook, the server) writes subscriptions or orders;
--   * the ledger and the comments are append-only for signed-in users (no update / delete grant);
--   * TRUNCATE / TRIGGER / REFERENCES are gone for both API roles (TRUNCATE skips row level security);
--   * the helper functions are not callable through the API.
-- A NEW TABLE gets Supabase's default grants again - repeat the matching lines below for it.

-- 1) Tables and the view.
revoke all on public.projects, public.project_comments, public.credit_ledger, public.subscriptions, public.orders,
              public.profiles, public.client_notes, public.client_overview from anon;
revoke truncate, trigger, references on public.projects, public.project_comments, public.credit_ledger, public.subscriptions,
              public.orders, public.profiles, public.client_notes, public.client_overview from authenticated;
revoke insert, update, delete on public.subscriptions, public.orders, public.client_overview from authenticated;
revoke update, delete on public.credit_ledger, public.project_comments from authenticated;
revoke insert, delete on public.projects from authenticated;
revoke update on public.client_notes from authenticated;

-- A comment stays a comment, not a file dump.
do $$ begin
  alter table public.project_comments add constraint project_comments_body_length check (char_length(body) between 1 and 5000);
exception when duplicate_object then null; end $$;

-- 2) Functions: the event trigger and the updated_at trigger are not API endpoints.
do $$ begin
  revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
exception when undefined_function then null; end $$;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke execute on function public.client_project_action(uuid, text, text) from public, anon;

-- 3) Submitting a project: the same as credits.sql, plus bounds on everything the browser sends - text lengths, the
--    length of the film, how many answers and files - and every attached file must sit in this client's own folder for
--    this project (`<user id>/<project id>/...`), so a brief can never point the team at someone else's upload.
create or replace function public.submit_project(
  p_id uuid,
  p_title text,
  p_kind text,
  p_brief text,
  p_format text,
  p_duration integer,
  p_due date,
  p_answers jsonb,
  p_next_step text,
  p_files jsonb,
  p_client_name text,
  p_client_email text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  balance integer;
  created public.projects;
  f jsonb;
  prefix text;
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  if p_id is null then
    raise exception 'invalid_id';
  end if;
  if p_duration is null or p_duration <= 0 or p_duration > 3600 then
    raise exception 'invalid_duration';
  end if;
  if char_length(btrim(coalesce(p_title, ''))) = 0 or char_length(p_title) > 200
     or char_length(coalesce(p_kind, '')) > 100
     or char_length(coalesce(p_brief, '')) > 10000
     or char_length(coalesce(p_format, '')) > 60
     or char_length(coalesce(p_next_step, '')) > 500
     or char_length(coalesce(p_client_name, '')) > 200
     or char_length(coalesce(p_client_email, '')) > 320 then
    raise exception 'invalid_input';
  end if;
  if p_answers is not null and (jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) > 50 or char_length(p_answers::text) > 20000) then
    raise exception 'invalid_input';
  end if;
  if p_files is not null then
    if jsonb_typeof(p_files) <> 'array' or jsonb_array_length(p_files) > 30 then
      raise exception 'invalid_files';
    end if;
    prefix := uid::text || '/' || p_id::text || '/';
    for f in select * from jsonb_array_elements(p_files) loop
      if jsonb_typeof(f) <> 'object' or left(coalesce(f ->> 'path', ''), char_length(prefix)) <> prefix
         or position('..' in f ->> 'path') > 0 or char_length(coalesce(f ->> 'name', '')) > 300 then
        raise exception 'invalid_files';
      end if;
    end loop;
  end if;

  -- One submission at a time per client, so two tabs cannot spend the same seconds twice.
  perform pg_advisory_xact_lock(hashtext(uid::text));

  select coalesce(sum(seconds), 0) into balance from public.credit_ledger where user_id = uid;
  if balance < p_duration then
    raise exception 'insufficient_credits';
  end if;

  insert into public.projects (id, user_id, title, kind, status, brief, format, duration_seconds, due_date, brief_answers, next_step, brief_files, client_name, client_email)
  values (p_id, uid, btrim(p_title), p_kind, 'brief', p_brief, p_format, p_duration, p_due, coalesce(p_answers, '[]'::jsonb), p_next_step, coalesce(p_files, '[]'::jsonb), p_client_name, p_client_email)
  returning * into created;

  insert into public.credit_ledger (user_id, seconds, kind, project_id, note)
  values (uid, -p_duration, 'spend', created.id, left(btrim(p_title), 200));

  return to_jsonb(created);
end;
$$;

revoke all on function public.submit_project(uuid, text, text, text, text, integer, date, jsonb, text, jsonb, text, text) from public, anon;
grant execute on function public.submit_project(uuid, text, text, text, text, integer, date, jsonb, text, jsonb, text, text) to authenticated;

-- ======================= 8/8  approval =======================
-- APPROVAL IS FINAL (8/9). Run once in the Supabase SQL Editor, AFTER delivery.sql (safe to re-run).
--
-- The client's two moves on a film in review (client_project_action, delivery.sql):
--   * Request a revision -> back to "production" (one revision used, the note added to the list);
--   * Approve            -> "delivered", stamped with approved_at. The site shows a green "Approved" step after
--                           Delivered from then on.
-- An approved project is closed: no revision can be asked for, and its stage cannot be moved off Delivered - not by the
-- client and not by mistake from the team dashboard. (To reopen one on purpose, clear approved_at in the same update.)

-- 1) The client's action: refuses anything on an approved project, explicitly.
create or replace function public.client_project_action(p_id uuid, p_action text, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  proj public.projects;
  note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;

  select * into proj from public.projects where id = p_id and user_id = uid for update;
  if not found then
    raise exception 'not_found';
  end if;
  if proj.approved_at is not null then
    raise exception 'already_approved';
  end if;
  -- In review: approve or ask for a revision. Being reworked after a revision: the client may still approve the version
  -- they have (they changed their mind), but not ask for another revision.
  if proj.status <> 'review' and not (p_action = 'approve' and proj.status = 'production' and proj.revisions_used > 0) then
    raise exception 'not_in_review';
  end if;

  if p_action = 'approve' then
    update public.projects
       set status = 'delivered', approved_at = now(), next_step = null
     where id = p_id
    returning * into proj;
  elsif p_action = 'revision' then
    if note is null then
      raise exception 'note_required';
    end if;
    if proj.revisions_used >= proj.revisions_total then
      raise exception 'no_revisions_left';
    end if;
    update public.projects
       set status = 'production',
           revisions_used = revisions_used + 1,
           revisions = coalesce(revisions, '[]'::jsonb)
                       || jsonb_build_array(jsonb_build_object('title', left(note, 2000), 'date', current_date, 'done', false)),
           next_step = null
     where id = p_id
    returning * into proj;
  else
    raise exception 'invalid_action';
  end if;

  return to_jsonb(proj);
end;
$$;

revoke all on function public.client_project_action(uuid, text, text) from public, anon;
grant execute on function public.client_project_action(uuid, text, text) to authenticated;

-- 2) The guard on every update: an approved project stays Delivered unless the approval itself is cleared.
create or replace function public.guard_project_approval()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.approved_at is not null and new.approved_at is not null and new.status <> 'delivered' then
    raise exception 'project_approved' using hint = 'An approved project stays Delivered. Clear approved_at to reopen it.';
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_project_approval() from public, anon, authenticated;

drop trigger if exists projects_guard_approval on public.projects;
create trigger projects_guard_approval
  before update on public.projects
  for each row execute function public.guard_project_approval();

-- ======================= 9/9  change requests + reviews =======================
-- CHANGE REQUESTS AND REVIEWS (9/9). Run once in the Supabase SQL Editor, AFTER approval.sql (safe to re-run).
--
-- 1) Change requests: while a project is being made the client can ask to
--      * move the deadline  - $50 for every day it comes closer (later is free), never sooner than 2 days from today;
--      * make the film longer - the extra seconds come from their video time; seconds they do not have are bought on the
--                             spot at the one-time price ($11.90 a second), up to a 10-minute film;
--      * add a format       - as many seconds as the film is long, from their video time (missing seconds bought alike);
--      * add a revision     - $49 each.
--    Every price is worked out HERE (request_project_change), never taken from the browser. Seconds are spent the moment
--    the request is sent and given back if the team declines it; a paid request waits for its Stripe payment
--    (`awaiting_payment`, settled by the webhook) before the team sees it. The team approves - which applies the change to
--    the project - or declines (resolve_project_request). Prices live in src/lib/project-changes.ts too - keep in step.
-- 2) Reviews: once the client has approved the film they can rate it - quality, speed and attitude, 1 to 5 - with an
--    optional comment, and change their rating later.

-- ---------------------------------------------------------------- requests
create table if not exists public.project_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('deadline', 'duration', 'format', 'revision')),
  details jsonb not null default '{}'::jsonb,
  cost_seconds integer not null default 0 check (cost_seconds >= 0),
  cost_cents integer not null default 0 check (cost_cents >= 0),
  status text not null default 'requested' check (status in ('awaiting_payment', 'requested', 'approved', 'declined', 'cancelled')),
  stripe_session_id text,
  paid_at timestamptz,
  team_note text check (char_length(team_note) <= 1000),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists project_requests_project on public.project_requests (project_id, created_at desc);
-- One open request of each kind per project.
create unique index if not exists project_requests_one_open on public.project_requests (project_id, kind) where status in ('awaiting_payment', 'requested');

alter table public.project_requests enable row level security;
drop policy if exists "Clients read their own requests" on public.project_requests;
create policy "Clients read their own requests" on public.project_requests for select to authenticated using ((select auth.uid()) = user_id or public.is_admin());
revoke all on public.project_requests from anon;
revoke insert, update, delete, truncate, trigger, references on public.project_requests from authenticated;
grant select on public.project_requests to authenticated;

-- The longest film a client's plan allows, in seconds: a live subscription's monthly seconds, else a one-time video's
-- longest length (2 minutes). Mirrors planVideoCap() in src/lib/project-changes.ts.
create or replace function public.plan_video_cap(p_user uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select case s.plan_key when 'creator' then 40 when 'pro' then 60 when 'local' then 90 when 'brand' then 180 when 'enterprise' then 600 end
       from public.subscriptions s
      where s.user_id = p_user and s.status in ('active', 'trialing', 'past_due', 'unpaid')
      order by s.updated_at desc limit 1),
    120);
$$;
revoke all on function public.plan_video_cap(uuid) from public, anon, authenticated;

create or replace function public.request_project_change(p_project uuid, p_kind text, p_details jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  proj public.projects;
  req public.project_requests;
  balance integer;
  cap integer;
  new_due date;
  extra integer;
  fmt text;
  days_earlier integer;
  details jsonb;
  cost_s integer := 0;
  cost_c integer := 0;
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  select * into proj from public.projects where id = p_project and user_id = uid for update;
  if not found then
    raise exception 'not_found';
  end if;
  if proj.approved_at is not null or proj.status = 'delivered' then
    raise exception 'project_closed';
  end if;

  -- A request that was never paid for is replaced by the new one (any seconds it took go back first).
  insert into public.credit_ledger (user_id, seconds, kind, project_id, note)
  select uid, r.cost_seconds, 'refund', p_project, 'Change request replaced (' || p_kind || ')'
    from public.project_requests r
   where r.project_id = p_project and r.kind = p_kind and r.status = 'awaiting_payment' and r.cost_seconds > 0;
  update public.project_requests set status = 'cancelled', resolved_at = now()
   where project_id = p_project and kind = p_kind and status = 'awaiting_payment';
  if exists (select 1 from public.project_requests where project_id = p_project and kind = p_kind and status = 'requested') then
    raise exception 'request_open';
  end if;

  perform pg_advisory_xact_lock(hashtext(uid::text));
  select coalesce(sum(seconds), 0) into balance from public.credit_ledger where user_id = uid;

  if p_kind = 'deadline' then
    if proj.status not in ('brief', 'scripting', 'production') then
      raise exception 'not_allowed_now';
    end if;
    begin
      new_due := (p_details ->> 'date')::date;
    exception when others then
      raise exception 'invalid_date';
    end;
    if new_due is null or new_due < current_date + 2 or new_due > current_date + 365 or new_due = proj.due_date then
      raise exception 'invalid_date';
    end if;
    days_earlier := greatest(coalesce(proj.due_date - new_due, 0), 0);
    cost_c := days_earlier * 5000;
    details := jsonb_build_object('from', proj.due_date, 'to', new_due, 'days_earlier', days_earlier);

  elsif p_kind = 'duration' then
    if proj.status not in ('brief', 'scripting', 'production') then
      raise exception 'not_allowed_now';
    end if;
    extra := nullif(p_details ->> 'seconds', '')::integer;
    if extra is null or extra < 5 or extra % 5 <> 0 then
      raise exception 'invalid_length';
    end if;
    if coalesce(proj.duration_seconds, 0) + extra > 600 then
      raise exception 'over_max_length';
    end if;
    -- From the video time first; whatever is missing is bought at the one-time price.
    cost_s := least(extra, greatest(balance, 0));
    cost_c := (extra - cost_s) * 1190;
    details := jsonb_build_object('from', coalesce(proj.duration_seconds, 0), 'to', coalesce(proj.duration_seconds, 0) + extra, 'extra', extra, 'bought', extra - cost_s);

  elsif p_kind = 'format' then
    if proj.status not in ('brief', 'scripting', 'production', 'review') then
      raise exception 'not_allowed_now';
    end if;
    fmt := p_details ->> 'format';
    if fmt is null or fmt not in ('9:16 vertical', '16:9 horizontal', '4:3 classic', '3:4 portrait', '1:1 square', '21:9 cinema') then
      raise exception 'invalid_format';
    end if;
    if position(split_part(fmt, ' ', 1) in coalesce(proj.format, '')) > 0 then
      raise exception 'format_included';
    end if;
    if coalesce(proj.duration_seconds, 0) <= 0 then
      raise exception 'invalid_length';
    end if;
    cost_s := least(proj.duration_seconds, greatest(balance, 0));
    cost_c := (proj.duration_seconds - cost_s) * 1190;
    details := jsonb_build_object('format', fmt, 'bought', proj.duration_seconds - cost_s);

  elsif p_kind = 'revision' then
    if proj.status not in ('scripting', 'production', 'review') then
      raise exception 'not_allowed_now';
    end if;
    cost_c := 4900;
    details := jsonb_build_object('from', proj.revisions_total, 'to', proj.revisions_total + 1);

  else
    raise exception 'invalid_kind';
  end if;

  if cost_c = 0 and cost_s = 0 and p_kind <> 'deadline' then
    raise exception 'invalid_request';
  end if;

  insert into public.project_requests (project_id, user_id, kind, details, cost_seconds, cost_cents, status)
  values (p_project, uid, p_kind, details, cost_s, cost_c, case when cost_c > 0 then 'awaiting_payment' else 'requested' end)
  returning * into req;

  if cost_s > 0 then
    insert into public.credit_ledger (user_id, seconds, kind, project_id, note)
    values (uid, -cost_s, 'spend', p_project, 'Change request (' || p_kind || '): ' || left(proj.title, 150));
  end if;

  return to_jsonb(req);
end;
$$;
revoke all on function public.request_project_change(uuid, text, jsonb) from public, anon;
grant execute on function public.request_project_change(uuid, text, jsonb) to authenticated;

-- The client withdraws a request the team has not answered yet: an unpaid one, or one paid in seconds (given back).
-- A request paid with money stays with the team (refunds go through Stripe).
create or replace function public.cancel_project_request(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  req public.project_requests;
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  select * into req from public.project_requests where id = p_id and user_id = uid for update;
  if not found then
    raise exception 'not_found';
  end if;
  if req.status = 'awaiting_payment' or (req.status = 'requested' and req.paid_at is null) then
    update public.project_requests set status = 'cancelled', resolved_at = now() where id = p_id returning * into req;
    if req.cost_seconds > 0 then
      insert into public.credit_ledger (user_id, seconds, kind, project_id, note)
      values (uid, req.cost_seconds, 'refund', req.project_id, 'Change request withdrawn (' || req.kind || ')');
    end if;
    return to_jsonb(req);
  end if;
  raise exception 'not_cancellable';
end;
$$;
revoke all on function public.cancel_project_request(uuid) from public, anon;
grant execute on function public.cancel_project_request(uuid) to authenticated;

-- The team answers a request: approve applies it to the project, decline gives any seconds back.
create or replace function public.resolve_project_request(p_id uuid, p_decision text, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.project_requests;
  note text := nullif(left(btrim(coalesce(p_note, '')), 1000), '');
begin
  if not public.is_admin() then
    raise exception 'not_team';
  end if;
  select * into req from public.project_requests where id = p_id for update;
  if not found then
    raise exception 'not_found';
  end if;
  if req.status <> 'requested' then
    raise exception 'not_open';
  end if;

  if p_decision = 'approve' then
    if req.kind = 'deadline' then
      update public.projects set due_date = (req.details ->> 'to')::date where id = req.project_id;
    elsif req.kind = 'duration' then
      update public.projects set duration_seconds = (req.details ->> 'to')::integer where id = req.project_id;
    elsif req.kind = 'format' then
      update public.projects
         set format = case when coalesce(format, '') = '' then req.details ->> 'format' else format || ' + ' || (req.details ->> 'format') end
       where id = req.project_id;
    elsif req.kind = 'revision' then
      update public.projects set revisions_total = revisions_total + 1 where id = req.project_id;
    end if;
    update public.project_requests set status = 'approved', team_note = note, resolved_at = now() where id = p_id returning * into req;
  elsif p_decision = 'decline' then
    update public.project_requests set status = 'declined', team_note = note, resolved_at = now() where id = p_id returning * into req;
    if req.cost_seconds > 0 then
      insert into public.credit_ledger (user_id, seconds, kind, project_id, note)
      values (req.user_id, req.cost_seconds, 'refund', req.project_id, 'Change request declined (' || req.kind || ')');
    end if;
  else
    raise exception 'invalid_decision';
  end if;
  return to_jsonb(req);
end;
$$;
revoke all on function public.resolve_project_request(uuid, text, text) from public, anon;
grant execute on function public.resolve_project_request(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------- reviews
create table if not exists public.project_reviews (
  project_id uuid primary key references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  quality smallint not null check (quality between 1 and 5),
  speed smallint not null check (speed between 1 and 5),
  attitude smallint not null check (attitude between 1 and 5),
  comment text check (char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_reviews enable row level security;
drop policy if exists "Read your reviews" on public.project_reviews;
create policy "Read your reviews" on public.project_reviews for select to authenticated using ((select auth.uid()) = user_id or public.is_admin());
-- Only for your own project, and only once you have approved its film.
drop policy if exists "Review your approved projects" on public.project_reviews;
create policy "Review your approved projects" on public.project_reviews for insert to authenticated
  with check ((select auth.uid()) = user_id and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()) and p.approved_at is not null));
drop policy if exists "Change your reviews" on public.project_reviews;
create policy "Change your reviews" on public.project_reviews for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()) and p.approved_at is not null));

revoke all on public.project_reviews from anon;
revoke all on public.project_reviews from authenticated;
grant select, insert on public.project_reviews to authenticated;
grant update (quality, speed, attitude, comment, updated_at) on public.project_reviews to authenticated;
