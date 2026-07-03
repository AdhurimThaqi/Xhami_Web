-- ═══════════════════════════════════════════════════════════════
--  Migration 003 — partner organizations + condolence photos
--  Run once in: Supabase Dashboard → SQL Editor → paste → Run.
-- ═══════════════════════════════════════════════════════════════

-- ── PARTNERS ────────────────────────────────────────────────────
create table if not exists public.partners (
  id         bigint generated always as identity primary key,
  name       text not null,
  url        text not null default '',
  logo       text not null default '',
  created_at timestamptz not null default now()
);

alter table public.partners enable row level security;

drop policy if exists "partners readable by everyone" on public.partners;
drop policy if exists "admins manage partners" on public.partners;

create policy "partners readable by everyone"
  on public.partners for select using (true);

create policy "admins manage partners"
  on public.partners for all
  using (public.is_admin()) with check (public.is_admin());

-- Seed only when the table is empty (logos can be uploaded in admin)
insert into public.partners (name, url)
select * from (values
  ('Parandalo.ch', 'https://parandalo.ch'),
  ('VIOZ – Vereinigung der Islamischen Organisationen in Zürich', ''),
  ('DAIGS – Dachverband der Albanisch-Islamischen Gemeinschaften', ''),
  ('FIDS – Föderation Islamischer Dachorganisationen Schweiz', ''),
  ('Zürcher Forum der Religionen', '')
) as seed(name, url)
where not exists (select 1 from public.partners);

-- ── CONDOLENCE PHOTOS ───────────────────────────────────────────
alter table public.condolences
  add column if not exists photo text not null default '';
