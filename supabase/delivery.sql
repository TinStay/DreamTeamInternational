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
