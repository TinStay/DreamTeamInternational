-- The portfolio page's films, in the order the page shows them. The team arranges them in the admin dashboard
-- (/admin -> Portfolio); the page reads this table. Everything here is public anyway: anyone may read it, only the team
-- may change it. Run once in the Supabase SQL editor. Safe to run twice: the films are only seeded into an empty table.

create table if not exists public.portfolio_videos (
  id          uuid primary key default gen_random_uuid(),
  position    integer not null,
  source      text not null check (source in ('youtube', 'bunny')),
  video_id    text not null unique,                 -- a YouTube id, or a Bunny Stream guid in the site's library
  -- A film can sit in several categories. `PORTFOLIO_KEYS` in src/lib/portfolio-grid.ts - keep the two in step.
  categories  text[] not null check (
                cardinality(categories) > 0
                and categories <@ array['socialAds', 'corporate', 'tvAds', 'productVideos', 'brandMascots', 'motionGraphics', 'launchVideos', 'explainerVideos', 'ugcAds', 'realEstate', 'musicVideos']
              ),
  orientation text not null check (orientation in ('wide', 'tall')),
  created_at  timestamptz not null default now()
);

create index if not exists portfolio_videos_position_idx on public.portfolio_videos (position);

alter table public.portfolio_videos enable row level security;

drop policy if exists "Anyone reads the portfolio" on public.portfolio_videos;
create policy "Anyone reads the portfolio" on public.portfolio_videos for select to anon, authenticated using (true);

drop policy if exists "Team edits the portfolio" on public.portfolio_videos;
create policy "Team edits the portfolio" on public.portfolio_videos for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- A new table gets Supabase's default grants back (see hardening.sql).
revoke all on public.portfolio_videos from anon, authenticated;
grant select on public.portfolio_videos to anon, authenticated;
grant insert, update, delete on public.portfolio_videos to authenticated;

-- The admin page's Save: the whole list in its new order, in one transaction, so a failure leaves the old list standing.
-- Runs with the caller's rights, so row level security applies as well.
create or replace function public.save_portfolio(p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_allowed';
  end if;
  delete from public.portfolio_videos where true;
  insert into public.portfolio_videos (position, source, video_id, categories, orientation)
  select (e.ord - 1)::integer, e.item ->> 'source', e.item ->> 'video_id',
         array(select jsonb_array_elements_text(e.item -> 'categories')), e.item ->> 'orientation'
  from jsonb_array_elements(p_items) with ordinality as e(item, ord);
end;
$$;

revoke all on function public.save_portfolio(jsonb) from public, anon;
grant execute on function public.save_portfolio(jsonb) to authenticated;

-- The list the client set on 06-11-2026 (`PORTFOLIO_SEED` in src/lib/portfolio-seed.ts).
insert into public.portfolio_videos (position, source, video_id, categories, orientation)
select v.* from (values
  (0, 'bunny', 'c544d68d-3579-4266-b9c7-dee9892b58f4', array['socialAds'], 'tall'),
  (1, 'bunny', '12f1759a-23f3-4d1a-8723-66639b9d348f', array['explainerVideos'], 'wide'),
  (2, 'bunny', 'af9a43e0-c967-4f93-abc2-df82ca2f494b', array['explainerVideos'], 'wide'),
  (3, 'bunny', 'ca79ed29-dfe0-4594-aa66-769d9701a410', array['tvAds'], 'wide'),
  (4, 'bunny', 'c854ab2f-f388-481c-83d0-5aa73ddfbe67', array['socialAds'], 'wide'),
  (5, 'bunny', 'b7bd4d28-a15f-46cc-a82e-800d9d4e3ee9', array['tvAds'], 'wide'),
  (6, 'bunny', 'bc578b5f-b090-4c3a-bd18-1c1843d43f30', array['tvAds'], 'wide'),
  (7, 'bunny', '3fe879b1-3a7e-4adb-851d-7e6a04da71f9', array['corporate'], 'wide'),
  (8, 'bunny', 'c05cd30b-c3a2-4104-a9fd-70856df18c7c', array['socialAds'], 'tall'),
  (9, 'bunny', '5b06ab4b-b780-4e11-96fe-571b71dfa9aa', array['tvAds'], 'wide'),
  (10, 'bunny', '0adbb91f-8ed4-4f26-a6e3-46efbe51fad2', array['socialAds'], 'tall'),
  (11, 'bunny', '62fdb93f-b714-4a4f-ba64-71b6da6e56a8', array['tvAds'], 'wide'),
  (12, 'bunny', '1dd9d4d5-4459-48d5-9891-207b3bb9da5c', array['productVideos', 'launchVideos', 'tvAds'], 'wide'),
  (13, 'bunny', '973736cf-0b6c-417e-b0fe-45c5e2dfa14b', array['explainerVideos'], 'wide'),
  (14, 'bunny', '067fb3bd-0528-4972-bfba-5e0007f2e7c3', array['corporate'], 'wide'),
  (15, 'bunny', 'dbb13635-0fda-4d13-8ff6-1a832cbc54af', array['corporate'], 'wide'),
  (16, 'bunny', 'bfcc7c3b-7b93-4a42-8ee2-5a19e5010d8c', array['socialAds'], 'wide'),
  (17, 'bunny', '6f440f38-5b5b-4fd6-8b41-d56688a30ab4', array['corporate'], 'wide'),
  (18, 'bunny', '360b7a78-a7f5-4acf-808f-93f560eca261', array['tvAds'], 'wide'),
  (19, 'bunny', 'b633c834-4cd0-4d14-8207-8fe5a61e3e8a', array['brandMascots'], 'wide'),
  (20, 'bunny', 'f3940b7f-7cbc-424f-a484-9f689ef13cc6', array['motionGraphics'], 'wide'),
  (21, 'bunny', 'f7556ae8-ed63-43d5-b11a-4de81b3382f8', array['launchVideos'], 'wide'),
  (22, 'bunny', '03a3e5bb-fc72-4dfc-889c-fd1d7756a391', array['ugcAds'], 'wide'),
  (23, 'bunny', 'c2a94cde-3bd4-46e8-8520-c58adf837b3c', array['realEstate'], 'wide'),
  (24, 'bunny', 'e1561aba-3712-4fbe-a709-f6e3e7adb65b', array['musicVideos'], 'wide')
) as v (position, source, video_id, categories, orientation)
where not exists (select 1 from public.portfolio_videos);
