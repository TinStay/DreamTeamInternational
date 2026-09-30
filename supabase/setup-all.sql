-- ONE-FILE SETUP: projects + team + credits, in the right order. Run this once in the Supabase SQL Editor.
-- (Same content as projects.sql, then team.sql, then credits.sql. After it, make yourself an admin - see the snippet
-- inside the team.sql part below, and read README.md.)

-- ======================= 1/3  projects =======================
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

-- ======================= 2/3  team =======================
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

-- ======================= 3/3  credits =======================
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
