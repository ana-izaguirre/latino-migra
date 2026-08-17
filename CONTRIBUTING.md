# Contributing to LatinoMigra

> Development artefacts — commits, pull requests, issues, code comments and these
> docs — are written in English. The product itself (UI copy, guides, scholarship
> data) stays in Spanish, since it is built for Latin American migrants.

## Commands

```bash
npm run dev            # development server
npm run lint           # ESLint + TypeScript
npm run lint:fix       # auto-fix what can be fixed
npm run format         # apply Prettier
npm run format:check   # verify formatting (what CI runs)
npm run test:coverage  # unit tests + coverage thresholds
npm run test:e2e       # Playwright (desktop + mobile)
```

## Merge requirements for `main`

CI blocks the merge if any of these fail:

| Check | What it verifies |
|---|---|
| `format:check` | Prettier |
| `lint` | ESLint (0 errors) + `tsc --noEmit` |
| `test:coverage` | Tests and coverage thresholds |
| `e2e-tests` | Playwright on desktop and mobile |

### One-time GitHub setup

**Settings → Branches → Add branch ruleset** on `main`:

- ☑️ Require a pull request before merging
- ☑️ Require status checks to pass → select `Fast Unit Tests & Typecheck` and `End-to-End Tests`
- ☑️ Require branches to be up to date before merging
- ☑️ Block force pushes

Since a single person maintains this project, do **not** enable "Require
approvals" — you would lock yourself out. The protection that matters here is
that the checks pass, not that someone approves.

## About the coverage threshold

Thresholds live in `vitest.config.ts` and work as a **ratchet**: they sit just
below current coverage, so it can never drop, and they are raised as tests land.

A 95% global threshold is not realistic today and would be counterproductive.
The codebase is ~11,900 lines of components against ~1,550 lines of pure logic.
Reaching 95% globally would mean writing thousands of lines of tests that mostly
assert that JSX renders — which buys false confidence and slows every change.

What does work:

1. **High coverage where it counts.** `src/lib` is pure, verifiable logic.
   `PreferencesContext` is already at 100% and carries its own 95% threshold.
2. **A global ratchet.** Coverage cannot fall, and rises with every PR that adds
   tests.
3. **Patch coverage.** New code arrives covered. Codecov can enforce this per PR
   without having to fix the whole backlog first.

Reasonable medium-term target: 70% globally, with `src/lib` above 90%.

## Style

- Components use `const X: React.FC<Props> = ({...}) =>`.
- All user-visible text goes through `t()` from `src/lib/i18n.tsx`, not through
  `language === "en" ? ...` ternaries.
- Nothing is written to `localStorage` or `sessionStorage`; a test enforces this.
