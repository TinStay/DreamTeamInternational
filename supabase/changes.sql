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
