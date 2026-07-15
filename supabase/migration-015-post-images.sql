-- ═══════════════════════════════════════════════════════════════
--  Migration 015 - multiple images per news article
--  Run once in: Supabase Dashboard -> SQL Editor -> paste -> Run.
--
--  Adds an "images" array to posts so an article can hold a gallery
--  of photos (shown as a stacked deck that opens a slideshow).
--  The existing "img" column stays as the cover / thumbnail.
-- ═══════════════════════════════════════════════════════════════

alter table public.posts
  add column if not exists images jsonb not null default '[]';
