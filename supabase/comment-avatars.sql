-- The picture next to a comment: the author's sign-in avatar (Google / Microsoft give one), copied onto the comment when
-- it is written, so both sides of the thread show who wrote it. A comment without one shows the author's initials.
-- Run this once in the Supabase SQL Editor (after projects.sql); setup-all.sql includes it.
alter table public.project_comments add column if not exists author_avatar text;
-- Only a web address, and a short one: nothing else can ride along in a comment.
alter table public.project_comments drop constraint if exists project_comments_author_avatar_url;
alter table public.project_comments add constraint project_comments_author_avatar_url
  check (author_avatar is null or (author_avatar ~ '^https://' and char_length(author_avatar) <= 500));
