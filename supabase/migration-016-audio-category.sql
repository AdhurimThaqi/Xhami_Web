-- ═══════════════════════════════════════════════════════════════
--  Migration 016 - audio categories (Quran, Hadith, audiobooks, ...)
--  Run once in: Supabase Dashboard -> SQL Editor -> paste -> Run.
--
--  Lets the "surahs" audio table also hold hadith recordings and audio
--  books, grouped by category on the Kurani page. Existing rows default
--  to 'quran' so nothing changes for the surahs already added.
-- ═══════════════════════════════════════════════════════════════

alter table public.surahs
  add column if not exists category text not null default 'quran';
