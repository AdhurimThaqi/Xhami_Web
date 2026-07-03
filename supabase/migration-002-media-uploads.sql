-- ═══════════════════════════════════════════════════════════════
--  Migration 002 — media uploads (images, videos, Facebook links)
--  Run once in: Supabase Dashboard → SQL Editor → paste → Run.
--  (Safe to run on a project that already has schema.sql applied.)
-- ═══════════════════════════════════════════════════════════════

-- Media rows now carry a kind: 'image' | 'video' | 'facebook'
alter table public.media
  add column if not exists kind text not null default 'image'
  check (kind in ('image','video','facebook'));

-- ── STORAGE BUCKET for uploaded files ───────────────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Anyone may view files (the bucket is public), only admins may
-- upload, replace, or delete.
drop policy if exists "public read media files"  on storage.objects;
drop policy if exists "admins upload media files" on storage.objects;
drop policy if exists "admins update media files" on storage.objects;
drop policy if exists "admins delete media files" on storage.objects;

create policy "public read media files"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "admins upload media files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

create policy "admins update media files"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());

create policy "admins delete media files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
