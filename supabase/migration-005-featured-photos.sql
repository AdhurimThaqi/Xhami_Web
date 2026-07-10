-- ═══════════════════════════════════════════════════════════════
--  Migration 005 — hand-picked homepage (hero) photos
--  Run once in: Supabase Dashboard → SQL Editor → paste → Run.
-- ═══════════════════════════════════════════════════════════════

alter table public.media
  add column if not exists featured boolean not null default false;
