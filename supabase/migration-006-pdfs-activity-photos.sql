-- ═══════════════════════════════════════════════════════════════
--  Migration 006 — PDF documents + activity section photos
--  Run once in: Supabase Dashboard → SQL Editor → paste → Run.
-- ═══════════════════════════════════════════════════════════════

-- Allow 'pdf' as a media kind
alter table public.media drop constraint if exists media_kind_check;
alter table public.media
  add constraint media_kind_check
  check (kind in ('image','video','facebook','audio','pdf'));

-- Small key/value settings store (activity photos now, more later)
create table if not exists public.settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

drop policy if exists "settings readable by everyone" on public.settings;
drop policy if exists "admins manage settings" on public.settings;

create policy "settings readable by everyone"
  on public.settings for select using (true);

create policy "admins manage settings"
  on public.settings for all
  using (public.is_admin()) with check (public.is_admin());
