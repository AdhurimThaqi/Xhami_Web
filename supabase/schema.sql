-- ═══════════════════════════════════════════════════════════════
--  Haus des Friedens — Supabase schema
--  Run this once: Supabase Dashboard → SQL Editor → New query →
--  paste everything → Run.
-- ═══════════════════════════════════════════════════════════════

-- ── PROFILES (one row per registered user) ──────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default '',
  role       text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles readable by everyone"
  on public.profiles for select using (true);

create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row whenever someone registers
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by all admin-only policies
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- ── POSTS (news articles) ───────────────────────────────────────
create table if not exists public.posts (
  id         bigint generated always as identity primary key,
  title      text not null,
  category   text not null default 'Lajme',
  body       text not null,
  img        text not null default '',
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "posts readable by everyone"
  on public.posts for select using (true);

create policy "admins manage posts"
  on public.posts for all
  using (public.is_admin()) with check (public.is_admin());

-- ── CONDOLENCES ─────────────────────────────────────────────────
create table if not exists public.condolences (
  id         bigint generated always as identity primary key,
  name       text not null,
  born       text not null default '',
  died_on    date,
  city       text not null default '',
  msg        text not null default '',
  funeral    text not null default '',
  created_at timestamptz not null default now()
);

alter table public.condolences enable row level security;

create policy "condolences readable by everyone"
  on public.condolences for select using (true);

create policy "admins manage condolences"
  on public.condolences for all
  using (public.is_admin()) with check (public.is_admin());

-- ── MEDIA GALLERY ───────────────────────────────────────────────
create table if not exists public.media (
  id         bigint generated always as identity primary key,
  url        text not null,
  caption    text not null default 'Foto',
  created_at timestamptz not null default now()
);

alter table public.media enable row level security;

create policy "media readable by everyone"
  on public.media for select using (true);

create policy "admins manage media"
  on public.media for all
  using (public.is_admin()) with check (public.is_admin());

-- ── PRAYER TIMES (single row, id fixed to 1) ────────────────────
create table if not exists public.prayer_times (
  id         smallint primary key default 1 check (id = 1),
  sabah      text not null default '05:10',
  dreka      text not null default '13:15',
  ikindia    text not null default '17:00',
  akshami    text not null default '20:35',
  jacia      text not null default '22:10',
  updated_at timestamptz not null default now()
);

alter table public.prayer_times enable row level security;

create policy "prayer times readable by everyone"
  on public.prayer_times for select using (true);

create policy "admins manage prayer times"
  on public.prayer_times for all
  using (public.is_admin()) with check (public.is_admin());

insert into public.prayer_times (id) values (1)
on conflict (id) do nothing;

-- ── SEED CONTENT (the articles currently in the prototype) ──────
insert into public.posts (title, category, body, img, created_at) values
  ('Iftar i përbashkët në Schwamendingen','Aktivitete','Të shtunën, në mbrëmjen e 28 shkurt 2026, Xhamia e Schwamendingen organizoi iftar të përbashkët ndërfetar. Ky event ishte shembull i shkëlqyer i dialogut ndërfetar dhe respektit të ndërsjellë në Cyrih.','https://hausdesfriedens.ch/wp-content/uploads/2026/03/DSC_4697-scaled.jpg','2026-03-02'),
  ('Shenjë kundër racizmit antimusliman','Bashkëpunimi','"Ne të gjithë i përkasim Zvicrës" – një shenjë e fuqishme kundër racizmit antimusliman dhe antisemitizmit. Xhamia jonë bashkë me organizata tjera mori pjesë në këtë iniciativë të rëndësishme.','','2025-05-25'),
  ('Takimi me rininë – Jugendtreff','Aktivitete','Falënderim i madh për Dr. Lumni Ademi për ligjëratën jashtëzakonisht interesante me temën "Kurani dhe shkenca moderne". Jugendtreff vazhdon të jetë hapësirë frytdhënëse.','','2025-05-23'),
  ('Kuvendi i rregullt i Xhamisë 2026','Lajme','Kuvendi vjetor i rregullt i xhamisë u mbajt me sukses. Anëtarët diskutuan planin e aktiviteteve, buxhetin dhe çështje të tjera të rëndësishme për komunitetin tonë.','','2026-03-31'),
  ('Pranimi i Imamëve nga Qyteti i Cyrihut','Lajme','Imamët e xhamive të Cyrihut u pritën zyrtarisht nga Qyteti i Cyrihut. Kjo takim u bë rast për dialog dhe forcim të marrëdhënieve ndërmjet institucioneve fetare dhe pushtetit lokal.','','2025-05-28'),
  ('Bashkatdhetarët ndërtuan shtëpi për familjen e dëshmorit','Lajme','Me ndihmën e xhematit të xhamisë Schwamendingen, familja e Fadil Sylejmanit mori shtëpi të re. Ky akt solidariteti tregoi fuqinë e komunitetit tonë.','','2019-04-10');

insert into public.media (url, caption) values
  ('https://hausdesfriedens.ch/wp-content/uploads/2026/03/DSC_4697-scaled.jpg','Iftar 2026'),
  ('https://hausdesfriedens.ch/wp-content/uploads/2026/03/DSC_4669-1-scaled.jpg','Xhamia'),
  ('https://hausdesfriedens.ch/wp-content/uploads/2026/03/DSC_4670-1-scaled.jpg','Aktivitet'),
  ('https://hausdesfriedens.ch/wp-content/uploads/2026/03/DSC_4674-1-scaled.jpg','Bashkësia'),
  ('https://hausdesfriedens.ch/wp-content/uploads/2026/03/DSC_4728-scaled.jpg','Namazi'),
  ('https://hausdesfriedens.ch/wp-content/uploads/2026/03/DSC_4745-1-scaled.jpg','Galeria');

-- ═══════════════════════════════════════════════════════════════
--  AFTER running this file:
--  1. Register your admin account through the website (Regjistrim).
--  2. Come back to the SQL Editor and run (with your real email):
--
--     update public.profiles set role = 'admin'
--     where id = (select id from auth.users
--                 where email = 'YOUR-EMAIL@EXAMPLE.COM');
--
--  Everyone else who registers stays a normal 'member'.
-- ═══════════════════════════════════════════════════════════════
