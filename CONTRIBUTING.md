# Contributing to LatinoMigra

> Development artefacts — commits, pull requests, issues, code comments and
> documentation — are written in English. The product itself (UI copy, guides,
> scholarship data) stays in Spanish, since it is built for Latin American
> migrants.

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

## Merge gates

CI blocks the merge to `main` if `format:check`, `lint`, `test:coverage` or the
Playwright suite fails. Branch protection is configured in GitHub, not in the
repository — see [docs/ci-cd.md](./docs/ci-cd.md).

## Pull requests

One change per pull request. Two unrelated changes force a reviewer into a
single yes-or-no on both. See [CLAUDE.md](./CLAUDE.md) for why this is easy to
get wrong here, and what to do instead.

## Style

- All user-visible text goes through `t()` from `src/lib/i18n.tsx`.
- Nothing is written to `localStorage` or `sessionStorage`; a test enforces this.
- Components use `const X: React.FC<Props> = ({...}) =>`.

The full set of rules, including the constraints a reasonable default would
break, is in [CLAUDE.md](./CLAUDE.md). How the system works is in
[docs/](./docs/README.md).
