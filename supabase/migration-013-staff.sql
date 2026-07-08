-- ═══════════════════════════════════════════════════════════════
--  Migration 013 - staff directory (Kryesia e Xhamisë)
--  Run once in: Supabase Dashboard -> SQL Editor -> paste -> Run.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.staff (
  id           bigint generated always as identity primary key,
  name         text not null default '',
  position_sq  text not null default '',
  position_de  text not null default '',
  photo        text not null default '',
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.staff enable row level security;

drop policy if exists "staff readable by everyone" on public.staff;
drop policy if exists "admins manage staff"        on public.staff;

create policy "staff readable by everyone"
  on public.staff for select using (true);

create policy "admins manage staff"
  on public.staff for all
  using (public.is_admin()) with check (public.is_admin());
