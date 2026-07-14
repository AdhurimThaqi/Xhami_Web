-- ═══════════════════════════════════════════════════════════════
--  Migration 014 - events / calendar (Ngjarjet / Veranstaltungen)
--  Run once in: Supabase Dashboard -> SQL Editor -> paste -> Run.
--
--  Upcoming events (Jumua, lectures, Ramadan iftars, Bajram, ...).
--  Public page lists future events sorted by date; past ones drop off.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.events (
  id          bigint generated always as identity primary key,
  title_sq    text not null default '',
  title_de    text not null default '',
  desc_sq     text not null default '',
  desc_de     text not null default '',
  event_date  date not null,
  event_time  text not null default '',
  location    text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.events enable row level security;

drop policy if exists "events readable by everyone" on public.events;
drop policy if exists "admins manage events"        on public.events;

create policy "events readable by everyone"
  on public.events for select using (true);

create policy "admins manage events"
  on public.events for all
  using (public.is_admin()) with check (public.is_admin());
