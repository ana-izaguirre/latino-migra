# CI/CD

## Workflows

Two workflows in `.github/workflows/`.

### `ci.yml` — "CI / Unit & E2E Tests"

Triggers: push to `main`/`master`, pull requests to those branches, and manual
dispatch with a `full_e2e` input.

**Job `unit-tests`** (5 min timeout, `contents: read` + `pull-requests: write`):
1. `npm ci || npm install`
2. `npm run format:check` — Prettier
3. `npm run lint` — ESLint then `tsc --noEmit`
4. `npm run test:coverage` — fails when thresholds are not met
5. Renders the coverage table into the job summary via
   `scripts/coverage-summary.mjs`
6. Posts the same table as a sticky pull request comment, updating the existing
   one rather than adding a new comment per push
7. Uploads the HTML coverage report (7-day retention)

**Job `e2e-tests`** (10 min timeout, needs `unit-tests`):
1. `npm ci || npm install`
2. `npx playwright install chromium --with-deps`
3. `npm run build`
4. `npm run test:e2e`
5. Uploads the Playwright report (7-day retention)

### `update-scholarships.yml` — "Scholarship Sync (Cron Job)"

Triggers: Sundays at 04:00 UTC, plus manual dispatch with an `academic_year`
input.

1. Verifies `secrets.CRON_SECRET` and `vars.APP_BASE_URL` are set, failing with
   an annotation if not.
2. `POST {APP_BASE_URL}/api/cron/sync-scholarships` with the secret and academic
   year, with retries and a 300 s cap.
3. Parses `updatedCount` from the response and writes it to the job summary.
4. Warns when the sync returns zero scholarships.

> The endpoint it calls returns the generated data but does not persist it (see
> [data.md](./data.md)). The workflow reports success while the catalogue is
> unchanged.

## Project board sync

`.github/workflows/project-status.yml` fires when a `status:*` label is added to
an Issue and moves that card's Status field on the Project.

It exists because Projects V2 is a GraphQL-only API and the AI session doing the
work has REST access only: it can label an Issue but cannot edit the board. The
label is the interface between the two.

`status:in-progress` → In Progress, `status:ready` → Ready,
`status:ai-review` → AI Review. The mapping is mechanical — the label suffix is
title-cased with dashes turned into spaces — so a new Status option needs no
change here beyond the option existing on the Project.

**Requires the `PROJECT_TOKEN` secret**: a fine-grained PAT with read/write on
Projects. The built-in `GITHUB_TOKEN` cannot write to Projects V2 at all, which
is a platform limitation rather than a permission that can be widened in the
workflow. Without the secret the job fails loudly rather than skipping, so a
stale board is visible instead of silent.

## Merge gates

CI blocks a merge to `main` when any of these fails:

| Check | What it verifies |
|---|---|
| `format:check` | Prettier |
| `eslint` | 0 errors, at most 35 warnings |
| `tsc` | 0 type errors |
| `test:coverage` | Tests and coverage thresholds |
| `e2e-tests` | Playwright on desktop and mobile |

Branch protection itself is **not configured in the repository** — it must be
enabled under **Settings → Branches → Add branch ruleset** on `main`:

- Require a pull request before merging
- Require status checks to pass — select `Fast Unit Tests & Typecheck` and
  `End-to-End Tests`
- Require branches to be up to date before merging
- Block force pushes

"Require approvals" stays **off** while a single person maintains the project;
enabling it would lock the maintainer out of their own repository. The
protection that matters here is that the checks pass, not that someone approves.

### Code owners

`.github/CODEOWNERS` lists the paths where a passing build proves nothing —
Firestore rules and write paths, the shared types, the deployment files, the
workflows, and the dependency manifest. GitHub **requests** a review from the
owner on any pull request touching them, and that request is the gate:
everything not listed merges on green CI alone. The reasoning per path is in
[CONTRIBUTING.md](../CONTRIBUTING.md), "Which pull requests need a review".

Requesting is not blocking. To make it block, enable *Require review from Code
Owners* in the ruleset — but only together with a bypass entry for the
maintainer, for the same reason "Require approvals" is off: nobody can approve
their own pull request, and every pull request here currently has the same
author. Enabling it without the bypass stops all merges.

## Deployment

Not in the repository. Vercel deploys from its git integration:

- Production on pushes to the default branch.
- A preview deployment per pull request.

`vercel.json` controls the build (`vite build` → `dist`), security headers, and
routing: `/api/*` to the serverless function, everything except `/api/` and
`/_vercel/` to `index.html`.

## Secrets and variables

| Name | Type | Used by |
|---|---|---|
| `CRON_SECRET` | secret | `update-scholarships.yml` |
| `APP_BASE_URL` | variable | `update-scholarships.yml` |
| `GITHUB_TOKEN` | automatic | coverage PR comment |

Gemini and Firebase credentials are configured in Vercel, not in GitHub Actions.

## Pipeline risks

**`npm ci || npm install`** — the fallback turns a lockfile mismatch, which is a
real signal, into a silent install of a different dependency tree. CI can pass
green against dependencies nobody tested and that are not what deploys.

**No `concurrency` group** — successive pushes to the same pull request run
redundant jobs that compete for runners.

**Playwright browsers are not cached** — `npx playwright install` re-downloads
Chromium on every run.

**E2E do not run against production configuration** — `npm run start` leaves
`NODE_ENV` unset, so the server serves through Vite rather than `dist/`.

**Two lockfiles** — `package-lock.json` and `bun.lock` are both tracked. CI uses
npm; a contributor using Bun would resolve a different tree.

**No CodeQL workflow in the repository.** Code scanning runs through GitHub's
default setup, so its configuration is not versioned alongside the code.
