# Architecture

Current state of the system. Verified against the code, not a target design.

## Stack

| Layer | Technology | Version |
|---|---|---|
| UI | React (SPA) | 19 |
| Build | Vite | 6 |
| Styling | Tailwind CSS (via `@tailwindcss/vite`) | 4 |
| Icons | lucide-react | 0.546 |
| Maps | `@vis.gl/react-google-maps` | 1.9 |
| Database | Firebase Firestore (client SDK) | 12 |
| Auth | Firebase Auth — Google popup | 12 |
| API server | Express | 4 |
| AI | `@google/genai` — Gemini | 2.x |
| Hosting | Vercel | — |
| Tests | Vitest + Playwright | 4 / 1.62 |
| Language | TypeScript | 5.8 |

Approximately 19,400 lines of TypeScript across 88 tracked files.

## Repository structure

```
├── api/index.ts             Vercel serverless entry — re-exports the Express app
├── server.ts                Express app: 2 API routes + static/dev serving
├── index.html               SPA shell, SEO meta tags, GA4 script tag
├── public/analytics.js      GA4 configuration (external so the page needs no inline script)
├── src/
│   ├── main.tsx             Root render; mounts the three context providers
│   ├── App.tsx              Tab state and conditional rendering of 10 screens
│   ├── types.ts             Shared domain types
│   ├── index.css            Tailwind theme, mobile ergonomics, animations, focus
│   ├── components/          21 components, one per screen plus shared widgets
│   ├── lib/                 firebase, i18n, currency, preferences, sanitize, auth, calendar
│   ├── data/                6 static TypeScript datasets (135 KB)
│   └── test/                Vitest setup, provider helper, server-side tests
├── tests/e2e/               Playwright: desktop journeys, mobile layout, consistency
├── firestore.rules          The only enforced data access control
└── .github/workflows/       ci.yml, update-scholarships.yml
```

## Main modules

### `src/lib` — 1,555 lines, high cohesion

| Module | Lines | Responsibility |
|---|---|---|
| `firebase.ts` | 808 | All Firestore and Auth access. The data layer. |
| `i18n.tsx` | 330 | `LanguageProvider` + 107 translation keys (`es` / `en`). |
| `currency.ts` | 165 | Conversion and formatting across supported currencies. |
| `PreferencesContext.tsx` | 88 | Shared origin/destination country, in memory. |
| `CurrencyContext.tsx` | 60 | Selected currency, in memory. |
| `googleCalendar.ts` | 125 | Builds Google Calendar event URLs. |
| `sanitize.ts` | 55 | `getSafeImageUrl`, `sanitizePlainText`. |
| `authUtils.ts` | 23 | `isAdmin()` and the admin email allowlist. |

### `src/components` — 11,881 lines

One component per screen. Four exceed 1,000 lines and mix data fetching,
business rules, UI state and presentation in a single file:

| Component | Lines | Concerns held in one file |
|---|---|---|
| `BecasExplorer.tsx` | 1,935 | catalogue, filters, favourites, 3 modals, Firestore sync |
| `PlanificadorMigracion.tsx` | 1,905 | plan, budget, checklist, persistence |
| `Comunidad.tsx` | 1,022 | forum, replies, posting, filters |
| `CalculadoraCostoVida.tsx` | 1,009 | cost model, currency, export, calendar |

Shared widgets: `TopNavBar`, `MobileBottomNav`, `Footer`, `Breadcrumbs`,
`FloatingChatWidget`, `ScrollTopBottomButton`, `AuthModal`,
`NotificationSettingsModal`, `CalendarAgendaButton`.

### `src/data` — 135 KB, bundled into the client

| Dataset | Records | Size |
|---|---|---|
| `migrationGuides.ts` | 7 countries, 57 visas | 48 KB |
| `scholarships.ts` | 22 | 35 KB |
| `locations.ts` | 32 consulates and campuses | 20 KB |
| `antiScamData.ts` | anti-scam guidance per country | 15 KB |
| `volunteeringData.ts` | 6 programmes | 11 KB |
| `countriesData.ts` | 29 Latin American + destination countries | 7 KB |

All six are imported eagerly and ship in the initial bundle.

## State management

Three React contexts, all in-memory with no persistence:

- `LanguageProvider` — `es` / `en`
- `CurrencyProvider` — selected display currency
- `PreferencesProvider` — origin and destination country, shared across screens

Everything else is component-local `useState`. Across `src/components` there are
**148 `useState`, 9 `useMemo`, 0 `useCallback` and 0 `React.memo`**.

## Routing

**There is no router.** `App.tsx` holds `activeTab` in `useState` and
conditionally renders one of ten screens.

Consequences of this decision, all currently in effect:

- No shareable URLs; every visitor lands on the same entry point.
- The browser back button does not navigate within the app.
- No deep linking to a specific scholarship, guide or consulate.
- Crawlers only ever see the home screen (see [seo.md](./seo.md)).

## Data flow

```
Browser ──► Firestore (direct, client SDK)   all persistent reads and writes
   │
   └─────► Express /api/chat                  Gemini chat
           Express /api/cron/sync-scholarships Gemini scholarship generation
```

The browser talks to Firestore directly. Express exists only to hold the Gemini
API key server-side. There is **no service layer and no server-side validation
of persisted data**: `firestore.rules` is the only enforced access control.

### Write paths

| What | Written by | Notes |
|---|---|---|
| User profile, plans, notes, bookmarks | Browser | Owner-scoped rules |
| Forum posts, replies, suggestions | Browser | `create` currently allows unauthenticated writes |
| Scholarship catalogue | Browser (admin UI) | `seedScholarshipsToDB()` writes documents one at a time |

`/api/cron/sync-scholarships` generates scholarship data with Gemini and
**returns it in the response body**. It does not import Firebase and does not
write to Firestore. The only component that persists the result is the browser.

## API surface

| Route | Method | Auth | Rate limit |
|---|---|---|---|
| `/api/health` | GET | none | 120 / 15 min |
| `/api/chat` | POST | none | 40 / 15 min |
| `/api/cron/sync-scholarships` | POST | `secretKey` in body vs `CRON_SECRET` | 10 / 15 min |

Input caps on `/api/chat`: 4,000 characters per message, 20 history turns,
128 KB JSON body.

## Architectural decisions detected

These are inferred from the code. Some are deliberate, some appear incidental.

1. **Client-direct database access.** No backend for data. Keeps the server
   trivial; makes `firestore.rules` the entire security boundary.
2. **Static datasets as the source of truth, Firestore as a cache.** Every
   dataset has a static fallback, so the app stays useful when Firestore is
   unavailable. The trade-off is that failures degrade silently.
3. **Tab state instead of routing.** Simplest possible navigation; costs URLs,
   history and crawlability.
4. **Express only for AI.** The API key never reaches the client. On Vercel this
   process serves only `/api/*`; the HTML and assets come from the CDN.
5. **No browser storage.** Nothing is written to `localStorage` or
   `sessionStorage`; a test enforces this. Preferences reset on reload.
6. **One deployment target.** `vercel.json` + `api/index.ts`. The Cloud Run
   `Dockerfile` from the earlier deployment has been removed.
7. **Email allowlist for admin.** `authUtils.ts` holds four addresses; the
   Firestore rule checks the verified email on the token.

## Known problems

Listed as facts about the current code.

| Area | Problem |
|---|---|
| Data rules | `forumPosts`, `forumPosts/{id}/replies` and `feedbackSuggestions` allow `create` without authentication. |
| Data rules | `visa_guide_votes` is read and written by `firebase.ts` but has **no rule declared**, so it falls through to the deny-all catch-all. The feature has never worked against Firestore; the in-memory fallback hides it. |
| Data integrity | The weekly sync workflow calls an endpoint that returns data and never persists it. The catalogue only updates when an admin opens the app and clicks a button. |
| Concurrency | `toggleBookmarkScholarship` is a query-check-write with `addDoc`, with no transaction. Zero `runTransaction` and zero `writeBatch` in the codebase. |
| Admin API | `triggerScholarshipSync()` calls the cron endpoint without `secretKey`, so the admin sync button receives 401/503 since `CRON_SECRET` was made fail-closed. |
| Resilience | No `ErrorBoundary` anywhere. A render exception blanks the whole app. |

## Technical debt

**Component size.** Four files over 1,000 lines mixing four concerns each. Adding
a feature means editing a file that already does everything.

**Render cost.** 148 `useState` against 9 `useMemo` and no memoisation. Every
state change re-renders the whole component subtree. Vercel Speed Insights
reports 40–80 ms renders when switching country in the guides.

**Duplicated modal markup.** Twelve `fixed inset-0` overlays across nine
components, each implemented separately. Two declare `role="dialog"`, one
declares `aria-modal`, none trap focus.

**Split i18n convention, and copy that never reaches it.** 125 inline
`language === "en" ? … : …` ternaries remain across seven components
(`Comunidad` 38, `NotificationSettingsModal` 23, `TopNavBar` 20, `ChatIA` 17,
`MapaConsulados` 13, `Footer` 12, `ScrollTopBottomButton` 2). This already
produced five tests asserting fallback strings that never render in production.

The larger gap is copy that goes through neither route. `HeroLanding` had zero
`t()` calls and rendered its Spanish inline, so switching to English changed the
navigation and left the landing page untouched — the reported symptom of "the
content does not change". That screen and `Breadcrumbs` now read from the
dictionary; the remaining screens still do not, and `BecasExplorer` in
particular carries 16 `t()` calls across 2,000 lines.

When wiring a screen up, note that the dictionary is not automatically the
source of truth for the Spanish: the `hero.*` keys had drifted to a different
headline than the one on screen while no component referenced them. Per
`CLAUDE.md`, running code wins — align the `es` side to what renders and add
the `en` side, rather than silently changing the copy.

**Misplaced dependencies.** `@vitejs/plugin-react` and `@tailwindcss/vite` sit
in `dependencies` rather than `devDependencies`, so they are installed in
production. The unused `motion` package, the duplicate `vite` entry and the
never-imported `ConversorMonedas.tsx` have been removed.

**Two chat implementations.** `ChatIA` calls Gemini through `/api/chat`.
`FloatingChatWidget` answers from a hardcoded `if/else` over keywords. The same
question gets different answers depending on entry point.

**No code splitting.** Zero `React.lazy` or dynamic imports. The bundle is
1,484 KB of JavaScript; all ten screens and all six datasets download to view one.

**Lockfile ambiguity.** Both `package-lock.json` and `bun.lock` are tracked. CI
runs `npm ci || npm install`, so a lockfile mismatch silently falls back to a
different dependency tree.

**Encoding artefact.** `vite.config.ts` contains a mojibake character in a
comment (`Do not modify�file watching…`).
