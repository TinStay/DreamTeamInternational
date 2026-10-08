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
