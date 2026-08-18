# Product

What the application does today, as built.

## Purpose

A Spanish-language platform for Latin American students and professionals
planning to migrate to Europe or North America. It combines a verified
scholarship catalogue, step-by-step visa guides, cost-of-living planning,
consular directory, community forum and an AI assistant.

The content is the product's core asset: 22 scholarships, 57 visa types across
7 destination countries, 32 consulates and campuses, and country-specific
anti-scam guidance.

## Screens

Ten screens, defined by the `NavigationTab` union in `src/types.ts`.

| Tab | Screen | What it does |
|---|---|---|
| `home` | Hero + catalogue | Landing hero, feature cards, then the **full** scholarship explorer |
| `becas` | Scholarship catalogue | Filter by country, education level, area, support type, institution, deadline; favourites; detail modal; suggest a scholarship |
| `guia` | Migration guides | Per-country visa guides: requirements, costs, timelines, document checklist, anti-scam section |
| `mapa` | Consular directory | Map + list of consulates, embassies and campuses; GPS detection; filter by origin and destination |
| `chat` | AI assistant | Full-screen chat backed by Gemini; conversation list; profile diagnosis form |
| `planificador` | 360° planner | Migration plan by origin/destination/pathway, step checklist, budget |
| `calculadora` | Cost of living | City-based budget model, currency conversion, export, calendar reminder |
| `voluntariados` | Volunteering | Catalogue of exchange, au pair, work & travel and language assistant programmes |
| `comunidad` | Community forum | Posts, replies, likes, category filters |
| `feedback` | Suggestions | Submit and upvote feature or scholarship suggestions |
| `admin` | Admin dashboard | Metrics, database view, cron controls, security tab. Hidden unless `isAdmin()` |

## Navigation

- **Desktop (≥1024 px):** four primary items inline — Becas, Guía de Migración,
  Mapa Consular, Chat IA — plus a **Herramientas** menu holding Comunidad,
  Planificador, Calculadora, Voluntariados, Sugerencias and Panel Admin.
  Currency, language and theme sit in a **Preferencias** menu.
- **Mobile (<1024 px):** bottom bar with Inicio, Becas, Guías, Chat IA and Menú;
  the drawer holds every destination plus currency, language and theme.

There are no URLs. Navigation is `useState` in `App.tsx`.

## Critical user flows

### 1. Find and save a scholarship
`home` or `becas` → filter → open detail modal → *Ver Detalles* → optionally
*Consultar IA* (jumps to chat with a pre-filled prompt) or *Calendar* (Google
Calendar deadline) → heart icon to favourite.

Favourites persist to Firestore only when signed in. For guests they live in
component state and are lost on reload.

### 2. Research a visa
`guia` → pick country → browse visa types by category → read requirements,
proof-of-funds, costs → *Preguntar a IA* → chat with a pre-filled question.

Selecting a country here updates the app-wide destination, so the planner,
calculator, consular map and alert settings follow.

### 3. Plan a migration
`planificador` → set origin, destination and pathway → the step list regenerates
from those three values → tick steps → per-step *Consultar IA*.

Completed steps persist to Firestore for signed-in users only.

### 4. Ask the assistant
Two entry points that behave differently:
- `chat` tab → `POST /api/chat` → Gemini.
- Floating bubble (visible on every screen) → hardcoded keyword matching, no
  network call.

### 5. Sign in
`AuthModal` → Google popup → profile written to `users/{uid}` → `App.tsx` reads
it back, and separately reads `admins/{uid}` to decide whether the account is an
administrator.

## Roles and permissions

Two roles: `user` and `admin`.

An account is an administrator when a document with its uid exists in the
`admins` collection. Nothing else grants it. The interface reads that document
once at sign-in (`isUserAdmin()` in `src/lib/firebase.ts`) and `isAdmin()` in
`src/lib/authUtils.ts` reports the resolved flag; `firestore.rules` checks the
same collection with `exists()`. One source of truth for both layers.

Administrators are added and removed from the Firebase console. There is no
in-app path — `admins` has no write rule, so the catch-all denies every client
write.

What admin unlocks in the UI: the `admin` tab, the database sync button in
`BecasExplorer`, and admin-only controls in the dashboard. The `admin` tab is
guarded at render and an effect returns a user who loses the role to `home`.

> Until #19 this was a self-service role: `AuthModal` offered a button that set
> `role: "admin"` on the current user, and `isAdmin()` believed it.

## Important states

| State | Where it lives | Survives reload |
|---|---|---|
| Active tab | `App.tsx` `useState` | No |
| Theme | `App.tsx`, seeded from `prefers-color-scheme` | No |
| Language | `LanguageProvider` | No |
| Currency | `CurrencyProvider` | No |
| Origin / destination country | `PreferencesProvider` | No |
| Scholarship favourites | Component state + Firestore | Only when signed in |
| Completed plan steps | Component state + Firestore | Only when signed in |
| Chat history | Component state | No |

Nothing is written to `localStorage` or `sessionStorage`; a test enforces this.

## Feature dependencies

- **Country selection** is shared through `PreferencesContext`. Guides, planner,
  consular map, scholarship filter and alert settings all read and write it. It
  starts empty so the catalogue is not pre-filtered before the user chooses.
- **Chat** is a destination for four other screens, which navigate to it with a
  pre-filled prompt (scholarship detail, guide, planner step, budget).
- **Currency** affects the calculator, planner budget and scholarship amounts.
- **Auth** gates persistence, not access. Every screen is usable signed out;
  only saving is lost.
- **Static datasets** back every Firestore-backed screen, so the app works
  without a database.

## Incomplete or partially wired features

| Feature | State |
|---|---|
| Visa guide helpfulness votes | Client code reads and writes `visa_guide_votes`, but no Firestore rule declares that path, so every operation is denied and silently falls back to an in-memory cache. Votes have never persisted. |
| Weekly scholarship sync | The workflow calls `/api/cron/sync-scholarships`, which generates data with Gemini and returns it. Nothing writes it to Firestore. The catalogue only updates through the admin UI. |
| Admin sync button | `triggerScholarshipSync()` posts without `secretKey`; since the endpoint was made fail-closed it returns 401/503. |
| Floating chat assistant | Answers from five hardcoded keyword branches; anything else gets a generic reply. Not connected to Gemini. |
| Google Analytics | `public/analytics.js` ships with the placeholder `G-MEASUREMENT_ID`. No data is collected. |
| Push notifications | `NotificationSettingsModal` requests browser permission and shows a confirmation, but no push subscription is registered and no service worker exists. |

## Edge cases worth knowing

- **Destinations without consular data.** `locations.ts` covers Alemania,
  Canadá, EE.UU., España, Reino Unido and Suiza. Choosing Portugal or Australia
  as destination leaves the map filter with no matching option, and it silently
  resets to "todos".
- **Guest favourites.** Lost on reload, with no warning that signing in would
  preserve them.
- **Firestore unavailable.** Every screen falls back to static data without
  telling the user, so stale content can look current.
- **Deadlines in the past.** The catalogue sorts by `deadlineDate` but nothing
  filters or flags expired calls, and the sync that would refresh them does not
  persist.
- **Two `<h1>` on home.** `HeroLanding` and `BecasExplorer` both render one.

## Potential functional errors

| Symptom | Cause |
|---|---|
| Duplicate favourites that cannot be removed | `toggleBookmarkScholarship` queries, checks, then writes with `addDoc` and no transaction. Two fast taps create two documents; deletion only removes `snapshot.docs[0]`. |
| Blank screen with no message | No `ErrorBoundary`; any render exception unmounts the app. |
| Chat scrolls to the bottom on open | `scrollIntoView` runs on first render against a seeded conversation that already has messages. |
| Partially updated catalogue | `seedScholarshipsToDB` writes sequentially with no batching; a mid-loop failure leaves two academic years mixed. |
| Guide labels never visible | `BecasExplorer` used an `xs:` breakpoint that was undefined until it was added to the theme. |
