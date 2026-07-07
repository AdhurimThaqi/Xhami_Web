-- ═══════════════════════════════════════════════════════════════
--  Migration 012 - custom pages (admin-built pages, auto-nav)
--  Run once in: Supabase Dashboard -> SQL Editor -> paste -> Run.
--
--  Each page: bilingual title/subtitle + an ordered list of content
--  blocks (text / image / video) stored as JSON. Pages appear
--  automatically in the navigation.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.pages (
  id          bigint generated always as identity primary key,
  title_sq    text not null default '',
  title_de    text not null default '',
  subtitle_sq text not null default '',
  subtitle_de text not null default '',
  blocks      jsonb not null default '[]',  -- [{type:'text'|'image'|'video', ...}]
  nav_order   int not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.pages enable row level security;

drop policy if exists "pages readable by everyone" on public.pages;
drop policy if exists "admins manage pages"        on public.pages;

create policy "pages readable by everyone"
  on public.pages for select using (true);

create policy "admins manage pages"
  on public.pages for all
  using (public.is_admin()) with check (public.is_admin());
