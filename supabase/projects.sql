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
