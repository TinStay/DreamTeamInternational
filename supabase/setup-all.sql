-- ONE-FILE SETUP: projects + team + credits + delivery + profiles, in the right order. Run this once in the Supabase SQL Editor.
-- (Same content as projects.sql, then team.sql, then credits.sql, then delivery.sql, then profiles.sql. After it, make yourself an admin - see the snippet
-- inside the team.sql part below, and read README.md.)

-- ======================= 1/5  projects =======================
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

-- ======================= 2/5  team =======================
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

-- ======================= 3/5  credits =======================
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

-- ======================= 4/5  delivery =======================
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
  if proj.status <> 'review' then
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

-- ======================= 5/5  profiles =======================
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
