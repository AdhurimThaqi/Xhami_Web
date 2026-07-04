-- ═══════════════════════════════════════════════════════════════
--  Migration 008 - website analytics (privacy-friendly)
--  Run once in: Supabase Dashboard -> SQL Editor -> paste -> Run.
--
--  Stores only: an event kind, the page path, a random anonymous
--  visitor token (kept in the visitor's own browser), and a
--  timestamp. No IP addresses, no names, no personal data.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.analytics (
  id         bigint generated always as identity primary key,
  kind       text not null check (kind in ('visit','contact')),
  path       text not null default '',
  visitor    text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists analytics_created_idx on public.analytics (created_at);

alter table public.analytics enable row level security;

drop policy if exists "anyone can log analytics" on public.analytics;
drop policy if exists "admins read analytics"   on public.analytics;

-- Visitors (anonymous or logged-in) may log events, but only admins
-- can read the data back for the dashboard report.
create policy "anyone can log analytics"
  on public.analytics for insert
  to anon, authenticated
  with check (kind in ('visit','contact'));

create policy "admins read analytics"
  on public.analytics for select
  using (public.is_admin());
