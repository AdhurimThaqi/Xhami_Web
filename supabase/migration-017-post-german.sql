-- ═══════════════════════════════════════════════════════════════
--  Migration 017 - German title/body for news articles
--  Run once in: Supabase Dashboard -> SQL Editor -> paste -> Run.
--
--  News articles become bilingual. The admin writes the article in
--  Albanian and can auto-translate to German (or edit it) in the editor.
--  German visitors then see the German version; existing articles keep
--  showing the Albanian text until a German version is added.
-- ═══════════════════════════════════════════════════════════════

alter table public.posts
  add column if not exists title_de text not null default '',
  add column if not exists body_de  text not null default '';
