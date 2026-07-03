-- ═══════════════════════════════════════════════════════════════
--  Migration 004 — audio tracks (Quran, lectures, hadith MP3s)
--  Run once in: Supabase Dashboard → SQL Editor → paste → Run.
-- ═══════════════════════════════════════════════════════════════

-- Allow 'audio' as a media kind
alter table public.media drop constraint if exists media_kind_check;
alter table public.media
  add constraint media_kind_check
  check (kind in ('image','video','facebook','audio'));
