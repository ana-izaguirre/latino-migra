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

## Which pull requests need a review

Most do not. CI blocks anything that fails `format:check`, `lint`,
`test:coverage` or Playwright, and for a change to copy, to one component's
presentation, to documentation or to tests, green CI is the whole answer. Those
merge without waiting.

A review is required where **CI cannot tell right from wrong**, because the
failure lands somewhere the suite does not reach:

| Path | Why a passing build proves nothing |
| --- | --- |
| `firestore.rules`, `src/lib/firebase.ts` | The browser talks to Firestore directly, so these are the only enforced access control. A wrong rule is a live data leak, and with no backup capability (#18) a wrong write path is irreversible. |
| `src/types.ts` | Reshapes records other screens already store. |
| `server.ts`, `vercel.json` | Deployment and the file that holds the Gemini key. |
| `.github/`, `.env*` | A workflow edit can switch off the checks guarding everything else. |
| `package.json` | A new dependency is someone else's code shipped to the browser, reviewed by no test here. |

`.github/CODEOWNERS` carries that list, so GitHub requests the review by itself
rather than leaving it to whoever remembers.

Two more need a human regardless of the paths touched:

- **A pull request whose own description states an assumption.** If the body
  says the Issue could be read two ways and names which reading it took, that is
  a product decision and no check resolves it.
- **Anything the Issue marks `Risk: High` or `Critical`**, per the Definition of
  Done in [CLAUDE.md](./CLAUDE.md).

CODEOWNERS **requests** a review; it does not block the merge. Making it block
means turning on *Require review from Code Owners* in the branch ruleset — and
with a single maintainer that locks the repository, since GitHub does not let
anyone approve their own pull request. If it is ever switched on, the
maintainer has to be added to the ruleset's bypass list first. See
[docs/ci-cd.md](./docs/ci-cd.md).

## Pull requests

One change per pull request, on its own branch cut from the latest `main`:
`claude/issue-<number>-<slug>`, or `claude/<slug>` when no Issue exists. Two
unrelated changes force a reviewer into a single yes-or-no on both. See
[CLAUDE.md](./CLAUDE.md).

## Style

- All user-visible text goes through `t()` from `src/lib/i18n.tsx`.
- Nothing is written to `localStorage` or `sessionStorage`; a test enforces this.
- Components use `const X: React.FC<Props> = ({...}) =>`.

The full set of rules, including the constraints a reasonable default would
break, is in [CLAUDE.md](./CLAUDE.md). How the system works is in
[docs/](./docs/README.md).
