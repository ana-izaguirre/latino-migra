# Deployment

How the application reaches production today.

## Target

**Vercel**, via its git integration. There is no deployment workflow in
`.github/workflows/`; Vercel builds on push.

- Production deploys from the default branch.
- Every pull request gets a preview deployment.

## Configuration

`vercel.json`:

```json
{
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

**Rewrites**
- `/api/(.*)` → `/api/index` — the serverless function
- `/((?!api/|_vercel/).*)` → `/index.html` — the SPA fallback

The `_vercel/` exclusion matters: Vercel injects Analytics and Speed Insights
scripts under that prefix, and a catch-all rewrite makes both report "No data
available".

**Headers** applied to every response: `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`,
`Strict-Transport-Security`.

`src/test/vercelConfig.test.ts` validates this file — the schema's allowed keys
and both routing rules — because Vercel only validates it at deploy time, so a
mistake here is invisible to the build, the linter and every other test.

## How the two halves are served

| Path | Served by |
|---|---|
| `/`, `/assets/*`, `/analytics.js` | Vercel CDN, from `dist/` |
| `/api/*` | Serverless function from `api/index.ts` |

`api/index.ts` re-exports the Express app from `server.ts`, so routes are defined
once for local development, tests and production.

`server.ts` skips `app.listen` when `process.env.VERCEL` is set, and imports Vite
lazily so it is never pulled into the serverless bundle.

Because the CDN serves the HTML, the page-level Content-Security-Policy set by
Helmet in `server.ts` does not apply in production — it only applies when Express
serves the SPA locally. Production security headers come from `vercel.json`.

## Environment variables in production

Configured in the Vercel project, not in the repository:
`GEMINI_API_KEY`, `CRON_SECRET`, the `VITE_FIREBASE_*` set and the Google Maps
key.

`GOOGLE_MAPS_PLATFORM_KEY` is inlined at build time by `vite.config.ts` through
`define`, so it is baked into the bundle.

## The unused Dockerfile

A multi-stage `Dockerfile` builds the frontend and the esbuild server bundle,
installs production dependencies and runs `npm start` on port 3000. It is a
Cloud Run configuration from an earlier deployment — the git history includes
`fix:remove Cloud Run badge from README`.

**Vercel does not use it.** Two deployment paths therefore coexist in the
repository with nothing indicating which is authoritative.

`server.ts` retains the corresponding static-serving branch for
`NODE_ENV=production`, which is what `npm start` exercises locally.

## Scheduled work

`.github/workflows/update-scholarships.yml` runs Sundays at 04:00 UTC and calls
`{APP_BASE_URL}/api/cron/sync-scholarships` with `CRON_SECRET`. It requires the
`APP_BASE_URL` repository variable to be set.

The endpoint returns generated data without persisting it, so the workflow
reports success while the catalogue is unchanged. See [data.md](./data.md).

## Backups and recovery

None configured or documented. Firestore does not take automatic backups unless
Point-in-Time Recovery or scheduled exports are enabled; there is no evidence of
either, and no `firestore.indexes.json` is versioned.

There is no documented procedure for restoring data after an accidental
deletion, a bad rules deployment or a faulty sync.
