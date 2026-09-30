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
