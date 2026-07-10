-- ═══════════════════════════════════════════════════════════════
--  Migration 010 - quizzes (native on-site + Kahoot links)
--  Run once in: Supabase Dashboard -> SQL Editor -> paste -> Run.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.quizzes (
  id          bigint generated always as identity primary key,
  title       text not null,
  description text not null default '',
  type        text not null default 'native' check (type in ('native','kahoot')),
  kahoot_url  text not null default '',
  questions   jsonb not null default '[]',   -- [{q, answers:[a,b,c,d], correct:0..3}]
  created_at  timestamptz not null default now()
);

alter table public.quizzes enable row level security;

drop policy if exists "quizzes readable by everyone" on public.quizzes;
drop policy if exists "admins manage quizzes"        on public.quizzes;

create policy "quizzes readable by everyone"
  on public.quizzes for select using (true);

create policy "admins manage quizzes"
  on public.quizzes for all
  using (public.is_admin()) with check (public.is_admin());
