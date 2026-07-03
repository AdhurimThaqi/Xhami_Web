# Xhami Web — Kulturzentrum Haus des Friedens / Shtëpia e Paqës

Redesign of [hausdesfriedens.ch](https://hausdesfriedens.ch/) — the website of the Albanian
Islamic cultural centre "Haus des Friedens" in Zürich Schwamendingen (est. 2004).

The current production site runs on WordPress and is hard for the mosque staff to maintain.
This project replaces it with a modern, fast, bilingual (Albanian / German) website with a
simple built-in admin area so staff can publish news themselves.

## Current state

A **front-end prototype with local persistence** (no build step, no dependencies beyond
Google Fonts). Open `index.html` directly in a browser to try it.

```
index.html           page markup (all pages + admin area)
css/styles.css       design system and all styles
js/app.js            routing, i18n, admin logic, data layer
js/config.js         Supabase project URL + publishable key (public values)
supabase/schema.sql  database schema — run once in the Supabase SQL Editor
```

The site has two data modes:

- **Remote mode (Supabase)** — when `js/config.js` has project credentials and the database
  is reachable, all content (news, condolences, prayer times, media, accounts) lives in a
  shared Postgres database. What an admin publishes is immediately visible to every visitor.
  Write access is enforced server-side by Row Level Security: only profiles with
  `role = 'admin'` can create/edit/delete content, no matter what the browser sends.
- **Demo mode (localStorage)** — when the backend is not configured or unreachable, the site
  falls back to per-browser localStorage so it stays fully usable for local development
  (including opening `index.html` straight from disk).

### Backend setup (one time)

1. In the [Supabase dashboard](https://supabase.com/dashboard) open **SQL Editor**, paste
   the whole of `supabase/schema.sql`, and click **Run**.
2. In **Authentication → Sign In / Providers → Email**, turn **off** "Confirm email"
   (or keep it on if you want registration emails — both work).
3. Open the website, register your own account (Regjistrim), then back in the SQL Editor
   promote it to admin:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'YOUR-EMAIL@EXAMPLE.COM');
   ```
4. Log out and back in on the site — the admin dashboard tabs appear.

### What it includes

- **Public pages** — home (hero slideshow, prayer-times strip, latest news, activities,
  donations, gallery, contact), news with search/category filters, history, statute, imam,
  activities, condolences, Islamic feasts, Quran, lectures, membership, contact.
- **Bilingual UI** — Albanian (sq) and German (de) via an in-page translation dictionary.
- **Member area with admin dashboard** — stats, news editor (create/edit/delete), condolence
  announcements, media gallery, profile settings.
- **Prayer times** — displayed live from [SwissMosque](https://tv.swissmosque.ch/?place=Mosque&mosqueId=1003)
  (mosque ID 1003). Deliberately **not** editable on the site; SwissMosque is the single
  source of truth.
- **Design system** — green/gold palette, Playfair Display + DM Sans, scroll-reveal
  animations, responsive layout down to mobile.

### Demo-mode accounts (localStorage fallback only — not used in remote mode)

| Role   | Email                        | Password  |
|--------|------------------------------|-----------|
| Admin  | admin@hausdesfriedens.ch     | admin123  |
| Member | demo@test.ch                 | demo1234  |

In remote mode these do not exist: accounts are real Supabase Auth users with hashed
passwords, and admin rights come from the `profiles.role` column.

## Known limitations

1. **Single-URL SPA** — every page shares one URL, so news articles can't be linked to or
   indexed by Google individually yet.
2. **Images are linked, not uploaded** — news/gallery images are added by URL. Upload to
   Supabase Storage with resizing is a planned step.
3. **Contact form is decorative** — it shows a confirmation but doesn't send anything yet.

## Roadmap

- [x] Design prototype
- [x] Split the monolith into maintainable files (css / js)
- [x] Interim persistence: admin data survives page reloads (localStorage)
- [x] Real backend: Supabase database + authentication, with RLS admin policies
      (localStorage kept as offline/demo fallback)
- [x] Prayer times sourced live from SwissMosque (admin editor removed by design)
- [x] Design pass: unified buttons, fixed hero layout, section headers, prayer strip,
      mobile refinements
- [x] Media uploads to Supabase Storage: images (auto-resized in browser), videos
      (≤50MB), Facebook video links as embeds; homepage gallery driven by the media
      library (run `supabase/migration-002-media-uploads.sql`)
- [x] Partner organizations section (admin-managed) + condolence photos
      (run `supabase/migration-003-partners-condolence-photos.sql`)
- [x] Per-article page with own URL (#lajmi-id); admin can upload the article image
- [ ] Full SEO (meta tags, sitemap, Open Graph per article)
- [ ] Contact form delivery (email or database inbox)
- [ ] Migrate existing WordPress content (posts + media)
- [ ] Deploy + point hausdesfriedens.ch at the new site
