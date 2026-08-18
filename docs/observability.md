# Observability

What the system can and cannot report about itself today.

## Two different things

**Product analytics** — what people do. Partially present.
**Application observability** — what the system does. Absent.

## Current capabilities

| Capability | Status | Detail |
|---|---|---|
| Web Vitals | Present | Vercel Speed Insights (`@vercel/speed-insights`), mounted in `main.tsx`. Reports INP around 80 ms |
| Page analytics | Present | Vercel Analytics (`@vercel/analytics`), mounted in `main.tsx` |
| Google Analytics 4 | **Not configured** | `public/analytics.js` ships with the placeholder `G-MEASUREMENT_ID`. The tag loads; no property receives data |
| Health endpoint | Present, unmonitored | `GET /api/health` returns `{ status: "ok" }`. Nothing polls it |
| Error tracking | Absent | No Sentry or equivalent, client or server |
| Structured logging | Absent | 41 `console.*` calls in plain text |
| Request / correlation IDs | Absent | No way to follow one request end to end |
| API monitoring | Absent | Latency and error rate of `/api/chat` are unknown |
| Database monitoring | Absent | No visibility into Firestore reads, writes or cost |
| Uptime monitoring | Absent | — |
| Alerting | Absent | No condition triggers a notification |
| Audit log | Absent | No record of catalogue changes, moderation or role changes |
| Error boundary | Absent | A render exception blanks the app with no report |

## What can be observed today

- Aggregate page views and Web Vitals, through the Vercel dashboard.
- CI results and test reports, through GitHub Actions artifacts.
- Firestore usage and billing, through the Firebase and Google Cloud consoles,
  by looking manually.

## What cannot be observed

- **Whether the API is working.** If `/api/chat` started returning 500 because
  the Gemini quota ran out, nothing would report it.
- **Whether the database is working.** If a rules deployment denied all writes,
  every screen would keep rendering from its static fallback and look correct.
- **Who did what.** No trail for catalogue overwrites, forum moderation or role
  changes.
- **Whether anyone is abusing the open write paths.** Anonymous document
  creation is reachable directly through the Firebase REST API; the first signal
  would be the bill.
- **Client-side exceptions.** No aggregation, so a crash affecting some users is
  invisible until someone reports it.

## The silent-fallback pattern

Every Firestore-backed screen falls back to static data on error, and the
fallback path logs a warning to the browser console and returns. The effect is
that failures degrade into stale-but-plausible content rather than visible
errors.

`visa_guide_votes` demonstrates this concretely: it has no Firestore rule, so
every read and write is denied, and the in-memory fallback has hidden that for
the lifetime of the feature. Nothing in the system reports it.

Combined with the absence of error tracking, this is the most consequential gap:
**the application is designed to keep working when it is broken, and nothing
records that it is broken.**

## Logging detail

`handleFirestoreError` in `src/lib/firebase.ts` builds a JSON object containing
the error message, operation type, path, and the user's **uid and email
address**, then writes it with `console.error`. In the browser that stays local;
anywhere it is collected it becomes stored personal data.

API error responses include `details: error.message`, which can pass upstream
provider messages through to the client.

## Instrumentation points that already exist

Useful anchors if instrumentation is added later:

- `/api/health` — ready for an uptime check.
- `handleFirestoreError` — a single funnel for every Firestore failure.
- `OperationType` enum in `firebase.ts` — already classifies read/write/update.
- The Express error handlers in `server.ts` — one place per route.
