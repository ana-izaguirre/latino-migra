# SEO

Current search and social metadata, and the structural limits on discoverability.

## What is in place

`index.html` carries a reasonably complete set of tags:

- `<html lang="es">`
- `<title>` — "LatinoMigra - Becas, Guías Migratorias y Asistente IA"
- `meta description` — names the specific programmes (Carolina, DAAD, Fulbright,
  OEA) and destination countries
- `meta keywords` — present, though ignored by major search engines
- `meta author`, `meta robots` = `index, follow`
- Open Graph: `og:type`, `og:site_name`, `og:url`, `og:title`, `og:description`,
  `og:image`
- Twitter Card: `summary_large_image` with title, description and image
- `viewport` with `viewport-fit=cover`

## What is missing

| Item | Status |
|---|---|
| `robots.txt` | Absent |
| `sitemap.xml` | Absent |
| `rel="canonical"` | Absent |
| `hreflang` | Absent, despite the app supporting `es` and `en` |
| Structured data (JSON-LD) | Absent |
| `manifest.json` | Absent |
| `favicon.ico` | Absent |
| Per-screen titles or descriptions | Absent |

## Structural limits

Two properties of the current architecture cap what any metadata work can
achieve.

**No routing.** Navigation is `useState` in `App.tsx`, so the entire application
lives at one URL. There is no page for a scholarship, a country guide or a
consulate. A crawler can only index the home screen, regardless of the 22
scholarships, 24 visa types and 32 consular records the app contains. A sitemap
would have exactly one entry.

**No server-side rendering.** `server.ts` runs Vite in `appType: "spa"`, and on
Vercel the build is a static SPA. The HTML shipped to a crawler is the shell in
`index.html` — an empty `<div id="root">` plus meta tags. All content requires
JavaScript execution. Google can render JavaScript, but does so on a delay and
with less reliability than server-rendered HTML; other crawlers and most social
scrapers do not render at all.

Together these mean the product's main asset — a large body of specific,
searchable migration content — is not indexable.

## Stale metadata

`og:url` points at a Cloud Run host from an earlier deployment:

```
https://ais-pre-5qazlj6w4zn36uak32ku6x-6760394599.europe-west2.run.app
```

The application deploys to Vercel. Every social share therefore advertises a URL
that is not the production site.

`og:image` and `twitter:image` both point at an Unsplash photograph rather than
project-owned artwork, so link previews carry a generic stock image and depend on
a third party remaining available.

## Analytics

`public/analytics.js` configures GA4 with the placeholder `G-MEASUREMENT_ID`.
The Google Tag Manager script loads but no property receives data, so there is
currently no search or acquisition data to work from.

## Content strengths worth noting

The underlying content is well suited to search, which is what makes the
structural limits costly:

- Long-tail specificity: named scholarships, named visa types, named consulates.
- Question-shaped topics that match how people search ("cuánto dinero necesito
  para estudiar en España").
- Bilingual copy already exists for 45 UI keys, though the content datasets are
  Spanish-only.
- Genuine authority signals: every guide links its official government source.
