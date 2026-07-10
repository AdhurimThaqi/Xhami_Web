-- ═══════════════════════════════════════════════════════════════
--  Migration 011 - Quran surahs (audio players)
--  Run once in: Supabase Dashboard -> SQL Editor -> paste -> Run.
--
--  Stores only surah metadata + an audio URL. The MP3 files
--  themselves are hosted externally (e.g. archive.org, free &
--  unlimited) or, for small sets, in Supabase Storage.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.surahs (
  id         bigint generated always as identity primary key,
  number     int not null default 0,
  name_sq    text not null default '',
  name_de    text not null default '',
  url        text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists surahs_number_idx on public.surahs (number);

alter table public.surahs enable row level security;

drop policy if exists "surahs readable by everyone" on public.surahs;
drop policy if exists "admins manage surahs"        on public.surahs;

create policy "surahs readable by everyone"
  on public.surahs for select using (true);

create policy "admins manage surahs"
  on public.surahs for all
  using (public.is_admin()) with check (public.is_admin());
