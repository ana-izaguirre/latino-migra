# Development

Local setup, environment and tooling as they exist today.

## Requirements

- Node.js 22 (the version CI uses)
- npm — `package-lock.json` is the only lockfile

## Setup

```bash
npm ci
cp .env.example .env    # then fill in the values below
npm run dev             # tsx server.ts — Express + Vite middleware on :3000
```

> The app starts **without** a `.env`. `src/lib/firebase.ts` falls back to a
> hardcoded configuration pointing at the `refined-coral-0zp2g` project, and
> `server.ts` constructs the Gemini client with `"dummy-key-for-boot"`. Nothing
> warns about this, so an unconfigured checkout can read from and write to a real
> Firebase project.

## Environment variables

`.env.example` documents 8 variables; the code reads 14.

### Documented and used

| Variable | Used by |
|---|---|
| `GEMINI_API_KEY` | `server.ts` — Gemini client |
| `VITE_FIREBASE_API_KEY` | `src/lib/firebase.ts` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `src/lib/firebase.ts` |
| `VITE_FIREBASE_PROJECT_ID` | `src/lib/firebase.ts` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `src/lib/firebase.ts` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `src/lib/firebase.ts` |
| `VITE_FIREBASE_APP_ID` | `src/lib/firebase.ts` |
| `VITE_FIREBASE_DATABASE_ID` | `src/lib/firebase.ts` — named Firestore database |

### Used but **not** documented in `.env.example`

| Variable | Used by |
|---|---|
| `CRON_SECRET` | `server.ts` — required, fails closed when unset |
| `GOOGLE_MAPS_PLATFORM_KEY` | `vite.config.ts` — injected at build time |
| `VITE_GOOGLE_MAPS_PLATFORM_KEY` | `src/components/MapaConsulados.tsx` |
| `PORT` | `server.ts` — defaults to 3000 |
| `NODE_ENV` | `server.ts` — selects the Vite or static branch |
| `VERCEL` | `server.ts` — skips `app.listen` when set |

`firebase-applet-config.json` is also supported as a local config source via
`import.meta.glob` in `src/lib/firebase.ts`, and is gitignored.

## Scripts

| Script | Does |
|---|---|
| `dev` | `tsx server.ts` — Express with Vite middleware |
| `build` | `vite build` then esbuild bundles `server.ts` to `dist/server.cjs` |
| `start` | `node dist/server.cjs` |
| `preview` | `vite preview` |
| `lint` | `eslint .` then `tsc --noEmit` |
| `lint:fix` | `eslint . --fix` |
| `typecheck` | `tsc --noEmit` |
| `format` | `prettier --write .` |
| `format:check` | `prettier --check .` — what CI runs |
| `test` / `test:unit` | `vitest run` |
| `test:watch` | `vitest` |
| `test:coverage` | `vitest run --coverage`, thresholds enforced |
| `test:e2e` | `playwright test` |
| `test:e2e:full` | `FULL_E2E=true playwright test` — adds firefox, webkit, iPhone 12 |
| `test:e2e:ui` | `playwright test --ui` |
| `test:e2e:report` | `playwright show-report` |
| `test:smoke` | `playwright test --grep @smoke` — **no test carries this tag yet** |
| `clean` | `rm -rf dist server.js` |

## Tooling

**ESLint 9** — flat config in `eslint.config.js` with `typescript-eslint`,
`eslint-plugin-react-hooks` and `eslint-plugin-jsx-a11y`. Defect-catching rules
are errors (`rules-of-hooks`, five a11y rules, `no-console` except
warn/error/info); the pre-existing backlog warns (`no-explicit-any`,
`exhaustive-deps`, unused vars, `no-alert`). Current state: **0 errors, 144
warnings**.

**Prettier** — `.prettierrc.json`, 100-column width, double quotes, ES5 trailing
commas. `.prettierignore` excludes build output, lockfiles and Markdown.

**TypeScript 5.8** — `tsconfig.json` sets no `strict`, so `strictNullChecks` and
`noImplicitAny` are off. `skipLibCheck` is on.

> `@types/react` and `@types/react-dom` are **not installed**. Without them
> `React.FC` resolves to `any` and JSX prop checking is disabled, so
> `npm run lint` passes without type-checking components. See
> [architecture.md](./architecture.md#known-problems).

## Debugging

- No source maps are published for the client build, so production stack traces
  are minified.
- No error tracking, so client exceptions are not collected. See
  [observability.md](./observability.md).
- `dist/server.cjs.map` is generated for the server bundle.
- Playwright traces on first retry, screenshots and video on failure.

## Reproducibility

- CI runs `npm ci || npm install`. The fallback means a lockfile mismatch does
  not fail the build; it silently installs a different dependency tree.
- Two lockfiles are tracked (`package-lock.json`, `bun.lock`).
- No `.nvmrc` or `engines` field pins the Node version; CI uses 22 by workflow
  configuration only.
- Development and production share the same Firebase project.

## Onboarding gaps

A new developer can start the app quickly, but cannot determine from the
repository which environment variables are required (5 are undocumented), which
of the two deployment paths is live, or what to do when data needs restoring.
