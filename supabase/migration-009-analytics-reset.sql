-- ═══════════════════════════════════════════════════════════════
--  Migration 009 - analytics reset with permanent backup
--  Run once in: Supabase Dashboard -> SQL Editor -> paste -> Run.
--
--  Resetting the live counters first saves a summary snapshot here,
--  so yearly totals are never lost.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.analytics_archive (
  id              bigint generated always as identity primary key,
  label           text not null default '',
  total_visits    integer not null default 0,
  unique_visitors integer not null default 0,
  total_contacts  integer not null default 0,
  from_date       timestamptz,
  to_date         timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.analytics_archive enable row level security;

drop policy if exists "admins manage archive" on public.analytics_archive;
create policy "admins manage archive"
  on public.analytics_archive for all
  using (public.is_admin()) with check (public.is_admin());

-- Allow admins to clear the raw analytics events (for a reset)
drop policy if exists "admins delete analytics" on public.analytics;
create policy "admins delete analytics"
  on public.analytics for delete
  using (public.is_admin());
