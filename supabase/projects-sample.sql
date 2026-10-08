-- Optional: puts three sample projects into YOUR account so you can see the real Your Projects page (not just ?sample=1).
-- 1. Run supabase/projects.sql first.
-- 2. Change the email below to the one you signed in with, then run this in the Supabase SQL Editor.
-- Delete them later with:  delete from public.projects where title in ('Summer Sale Reel', 'Titanium Wok Launch', 'Brand Story Film');

with me as (select id from auth.users where email = 'you@example.com' limit 1)
insert into public.projects (user_id, title, kind, status, brief, video_id, duration_seconds, due_date, revisions_total, revisions_used, timeline, format, manager_name, next_step, brief_answers, revisions)
select me.id, v.title, v.kind, v.status, v.brief, v.video_id, v.duration_seconds, v.due_date::date, v.revisions_total, v.revisions_used, v.timeline::jsonb, v.format, 'Nikolay from IzI Video', v.next_step, v.brief_answers::jsonb, v.revisions::jsonb
from me, (values
  ('Summer Sale Reel', 'Social Media Ad', 'delivered',
   'A 15-second vertical ad for our summer sale. Bright, fast, product first, with our logo in the last two seconds.',
   'b7bd4d28-a15f-46cc-a82e-800d9d4e3ee9', 15, '2026-10-05', 2, 1,
   '[{"title":"Brief received","date":"2026-09-22","note":"We confirmed the goal, the audience and the format.","done":true},{"title":"Script approved","date":"2026-09-24","note":"Three hooks proposed; you picked the second.","done":true},{"title":"First cut delivered","date":"2026-09-30","done":true},{"title":"Final files delivered","date":"2026-10-05","note":"9:16, 1:1 and 16:9 exports.","done":true}]',
   '9:16 vertical', 'All done - your final files are ready to download.',
   '[{"label":"Goal","value":"Boost summer sale sales"},{"label":"Audience","value":"Women 25-40, Bulgaria"},{"label":"Style","value":"Bright, fast, product first"}]',
   '[{"title":"Bigger logo at the end","date":"2026-10-02","done":true}]'),
  ('Titanium Wok Launch', 'TV Ad', 'review',
   'A 30-second commercial for a new titanium wok: steam, sizzle, close-ups of the food. Premium and warm.',
   '5b06ab4b-b780-4e11-96fe-571b71dfa9aa', 30, '2026-10-14', 2, 0, '[]',
   '16:9 broadcast', 'Watch the cut and send your notes - you have 2 revisions included.',
   '[{"label":"Goal","value":"Launch the titanium wok on TV"},{"label":"Style","value":"Premium, warm, cinematic"}]', '[]'),
  ('Brand Story Film', 'Corporate Video', 'production',
   'A one-minute film about who we are and why clients trust us. Calm, confident, no stock-footage feel.',
   null, 60, '2026-10-30', 3, 0,
   '[{"title":"Brief received","date":"2026-09-28","done":true},{"title":"Script and storyboard approved","date":"2026-10-03","note":"Fourteen shots, one voiceover.","done":true},{"title":"Scenes in production","note":"We are generating and directing the shots now.","done":false},{"title":"Voiceover, music and subtitles","done":false},{"title":"Review and delivery","date":"2026-10-30","done":false}]',
   '16:9', 'We are producing the scenes. Nothing needed from you right now.',
   '[{"label":"Goal","value":"Tell our story to investors"},{"label":"Tone","value":"Calm, confident"}]', '[]')
) as v(title, kind, status, brief, video_id, duration_seconds, due_date, revisions_total, revisions_used, timeline, format, next_step, brief_answers, revisions);
