-- ═══════════════════════════════════════════════════════════════
--  Migration 007 - video support for news articles
--  Run once in: Supabase Dashboard -> SQL Editor -> paste -> Run.
-- ═══════════════════════════════════════════════════════════════

alter table public.posts
  add column if not exists video text not null default '';
