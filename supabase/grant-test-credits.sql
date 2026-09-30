-- For testing WITHOUT payments: give a client video time by hand, so they can submit a project.
-- Change the email (the account you signed up with on the site) and the seconds, then run in the Supabase SQL Editor.
-- 120 seconds = 2 min 0 sec. 'creator' only decides the pack name shown in their menu (personal, creator, pro, local, brand).
-- Run it again to add more; to take time back, use a negative number and kind 'refund'.

insert into public.credit_ledger (user_id, seconds, kind, plan_key, note)
select id, 120, 'purchase', 'creator', 'Test credits'
  from auth.users
 where email = 'client@example.com';
