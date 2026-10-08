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
