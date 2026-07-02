# Xhami Web — Kulturzentrum Haus des Friedens / Shtëpia e Paqës

Redesign of [hausdesfriedens.ch](https://hausdesfriedens.ch/) — the website of the Albanian
Islamic cultural centre "Haus des Friedens" in Zürich Schwamendingen (est. 2004).

The current production site runs on WordPress and is hard for the mosque staff to maintain.
This project replaces it with a modern, fast, bilingual (Albanian / German) website with a
simple built-in admin area so staff can publish news themselves.

## Current state

`index.html` is a **self-contained front-end prototype** (no build step, no dependencies
beyond Google Fonts). Open it directly in a browser to try it.

### What it includes

- **Public pages** — home (hero slideshow, prayer-times strip, latest news, activities,
  donations, gallery, contact), news with search/category filters, history, statute, imam,
  activities, condolences, Islamic feasts, Quran, lectures, membership, contact.
- **Bilingual UI** — Albanian (sq) and German (de) via an in-page translation dictionary.
- **Member area with admin dashboard** — stats, news editor (create/edit/delete), condolence
  announcements, media gallery, prayer-time editing, profile settings.
- **Design system** — green/gold palette, Playfair Display + DM Sans, scroll-reveal
  animations, responsive layout down to mobile.

### Demo accounts (prototype only — not real security)

| Role   | Email                        | Password  |
|--------|------------------------------|-----------|
| Admin  | admin@hausdesfriedens.ch     | admin123  |
| Member | demo@test.ch                 | demo1234  |

## Known limitations (why this is still a prototype)

1. **No persistence** — all data (posts, users, prayer times, uploads) lives in a JavaScript
   object in memory. Refreshing the page resets everything.
2. **No real authentication** — credentials are hard-coded in the client-side source and
   visible to anyone. This is a UI mock, not security.
3. **Single-URL SPA** — every page shares one URL, so news articles can't be linked to or
   indexed by Google individually.
4. **Uploads aren't stored** — images are read as data URLs and disappear on refresh.

## Roadmap

- [x] Design prototype (this file)
- [ ] Split the monolith into maintainable files (css / js / pages)
- [ ] Add a real backend: database + authentication + news/media API
      (candidate: Supabase or PocketBase to keep hosting simple and cheap)
- [ ] Real prayer-times management (admin-editable, optionally auto-calculated)
- [ ] Per-article URLs + SEO (meta tags, sitemap, Open Graph) so news is indexable
- [ ] Image upload to real storage with automatic resizing
- [ ] Migrate existing WordPress content (posts + media)
- [ ] Deploy + point hausdesfriedens.ch at the new site
