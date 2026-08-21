# CLAUDE.md

Operating manual for AI coding agents working on LatinoMigra.

This file holds **rules**. It does not explain how the system works — that lives
in `docs/`. When a rule says "read X", read it before acting.

---

## Project context

A Spanish-language platform helping Latin American students and professionals
migrate to Europe and North America: verified scholarships, visa guides, cost
planning, a consular directory, a community forum and a Gemini-backed assistant.

React 19 SPA (Vite) · Firestore accessed directly from the browser · Firebase
Auth · a minimal Express server that exists only to hold the Gemini API key ·
deployed on Vercel.

**Architectural boundaries that matter:**

- The browser talks to Firestore directly. `firestore.rules` is the **only**
  enforced access control. There is no server-side validation layer.
- In production, Express serves **only** `/api/*`. The HTML and assets come from
  Vercel's CDN.
- There is no router. Navigation is `useState` in `App.tsx`.

Details: `docs/architecture.md`

---

## Source of truth

When sources disagree, trust in this order:

1. **Running code** — what it does now
2. **Tests** — what behaviour is pinned
3. **Specifications** in `specs/`
4. **Documentation** in `docs/`
5. **The GitHub Issue**
6. **Your own inference** — last, and always stated as an assumption

If code and documentation disagree, the code is current and the documentation is
stale: fix the documentation as part of your task, and say so in your report.

If code and an Issue's acceptance criteria disagree, **stop and ask**. Do not
assume either is wrong.

Never invent a requirement. If you cannot determine the correct behaviour from
the sources above, say so rather than choosing one.

---

## Non-negotiable constraints

These are project-specific. A reasonable default would break them.

1. **A signed-in user gets no browser storage at all.** Their preferences live
   in `userPreferences/{uid}` in Firestore. Anonymous visitors are the single
   exception: the `lm_prefs` cookie holds five display preferences — theme,
   language, currency, and the two countries — and nothing else. No identifier,
   nothing personal. Signing in migrates the cookie into Firestore and deletes
   it. `localStorage` and `sessionStorage` remain forbidden for everyone, and
   `src/test/noBrowserStorage.test.ts` fails if either is reintroduced. All of
   it goes through `src/lib/preferencesStore.ts`; nothing else touches
   `document.cookie`.

2. **UI copy is Spanish. Development artefacts are English.** Commit messages,
   PR titles and bodies, Issues, code comments and documentation: English. Text
   the user sees: Spanish.

3. **All user-visible text goes through `t()`** from `src/lib/i18n.tsx`. Never
   add a `language === "en" ? … : …` ternary. 125 already exist and are being
   removed (#13); do not add the 126th.

4. **Component tests must render through `src/test/renderWithProviders.tsx`.**
   Rendering bare makes context hooks fall back to inert defaults, so tests pass
   while asserting strings that never appear in production. This has already
   happened.

5. **Do not add silent fallbacks.** Every Firestore path already falls back to
   static data on error, which is why a broken feature (`visa_guide_votes`, #24)
   went unnoticed indefinitely. A failure must be visible somewhere.

6. **Do not convert function declarations to arrow functions.** Components
   already use arrow functions; the mixture in `src/lib` and `server.ts` is
   deliberate and was reviewed. Converting them fixes nothing and damages
   `git blame`.

7. **Do not put a page-level CSP in `server.ts`.** In production Express only
   serves `/api/*`, so it would not reach the document — but it *would* apply to
   the dev server, where it blocks Vite's inline preamble and stops React from
   mounting. Page CSP belongs in `vercel.json`. This has already broken the app
   once.

8. **Do not remove `@types/react` or turn off `strict`.** Without those types
   `React.FC` resolves to `any` and TypeScript silently stops checking JSX
   props — the checker keeps passing while verifying nothing, which is how a
   prop mismatch reached production once already.
   `src/test/typeChecking.test.ts` fails if either is undone.

---

## Workflow

### One change per pull request

A pull request answers one question: should this change land? Two unrelated
changes in one branch force a single yes-or-no on both, so a reviewer who wants
one and doubts the other has no way to say so.

This went wrong four times here — a TypeScript fix, a CSS fix, a lint sweep and
a CI change each landed in a pull request opened for something else. The cause
was structural rather than careless: one branch was designated for all the work,
so every commit made while a pull request was open joined that pull request.

**Branch per unit of work.** Cut it from the latest `main`, never from another
working branch:

```bash
git fetch origin main
git checkout -b claude/issue-38-forum-category-filter origin/main
```

Name it `claude/issue-<number>-<slug>` when an Issue exists, and
`claude/<slug>` when one does not. One branch, one pull request, one question
for the reviewer.

This means work never has to wait for a merge. Start the next Issue on its own
branch as soon as the previous pull request is open.

Two things still hold:

- A change *to* an open pull request — a review fix, a failing check, a merge
  conflict — belongs on that pull request's branch, not a new one.
- If two changes end up together anyway, the description must say so and
  describe both. A body that describes one change while the diff contains two
  is worse than the mixing itself.

### Trivial changes

A change is trivial when it is a typo, a comment, a single-line fix with an
obvious cause, or a formatting correction — and it touches no data, auth,
security or deployment path.

For those: implement → run relevant tests → report. No plan required.

### Everything else

```
Understand → Inspect → Plan → Confirm scope → Implement
          → Test → Review → Verify → Document → Report
```

1. Read the GitHub Issue and extract its **acceptance criteria**.
2. Read the documentation the Issue links to.
3. Inspect the current implementation. Do not assume it matches the docs.
4. Identify affected files, risks and dependencies.
5. Write a short plan — what changes, what is out of scope.
6. Confirm scope if the plan is larger than the Issue implies.
7. Implement **only** the approved scope.
8. Run the relevant tests. Add tests when behaviour changes.
9. Review your own diff before reporting (see *Reviewing your own work*).
10. Update documentation that the change made inaccurate.
11. Report.

---

## Keeping the board current

The Project's Status field is the record of what is happening. Move it as you
go, not afterwards.

| When | Set the label |
|---|---|
| You start work on an Issue | `status:in-progress` |
| You name the Issue you intend to take next | `status:ready` |
| You finish and are self-reviewing the diff | `status:ai-review` |

**Set the label, not the field.** Projects V2 is a GraphQL-only API and this
session has REST access only — it can label an Issue but cannot edit the board.
`.github/workflows/project-status.yml` watches for `status:*` labels and moves
the card. One label per Issue: remove the previous one when you add the next.

Backlog, Human Review, Blocked and Done are not set this way. The Project's own
workflows already handle Backlog on arrival and Done on close or merge, and the
remaining two are a human's call.

If the workflow has not been configured yet, say so in the report and give the
label you would have set, rather than leaving the board silently stale.

---

## Working from a GitHub Issue

Issues are the unit of work. The GitHub Project carries fields you must respect:
**Priority, Type, Risk, Effort, Area, AI Strategy, AI Tool, AI Autonomy,
Verification**. Values per Issue: `docs/project-fields.md`.

### AI Autonomy — respect the level

| Level | What you may do |
| --- | --- |
| **Human Only** | Analysis and recommendations only. **Do not write code.** |
| **Suggest** | Propose a solution and wait for approval before implementing. |
| **Implement** | Implement within scope. |
| **Implement + Test** | Implement and add tests. |
| **Implement + Test + Review** | The above, plus a documented self-review. |

Permission to modify code is **never** permission to modify production systems.

### AI Tool

If the Issue specifies a tool, follow it. Only recommend a different one when
there is a clear technical reason, and say why. Do not switch tools for
convenience.

### No Issue?

If the work is substantial and no Issue exists, ask whether one should be
created before expanding scope.

---

## Specifications

Write a spec in `specs/` for non-trivial features and architectural changes.
Do **not** write one for a bug fix.

```
Issue → Specification → Implementation Plan → Code → Tests → Review
```

A spec covers: problem, goals, non-goals, requirements, constraints, acceptance
criteria, edge cases, security considerations, testing strategy.

---

## Safety

### Database

The database is high risk. Read `docs/data.md` before any change to Firestore
rules, collections or write paths.

**Never** run against production: destructive deletes or updates, rule
deployments, or bulk writes — without explicit human approval.

Before proposing a database change, state:

1. What changes
2. The risks
3. Which collections and documents are affected
4. The rollback strategy
5. Which environment is targeted

There is currently **no backup or restore capability** (#18). Until that lands,
treat every data change as irreversible.

### Production

Never deploy manually, change production configuration or secrets, bypass CI,
disable a security control, or skip tests.

Development and production currently share one Firebase project. Assume any
local write can reach real data.

### Security

Read `docs/security.md` before touching authentication, authorization, sessions,
secrets, permissions, database access, API security or user data.

**Never** put a secret in source, logs, Issues, PRs, documentation or test
output. If you find an exposed secret, stop and report it — do not commit a fix
that includes the secret in the diff or the message.

---

## Testing

Read `docs/testing.md`.

- Run the relevant suite before calling anything done.
- Add or update tests when behaviour changes.
- **Never modify a test to make it pass** unless the test itself is wrong — and
  if it is, say why in your report.
- Coverage percentage is not a goal. Thresholds in `vitest.config.ts` are a
  ratchet that prevents regression, not a target to chase.
- Isolated logic → unit test. Component interaction, API or database →
  integration. Critical user flows and browser behaviour → E2E.
- Prefer stable `id` selectors over visible copy in E2E.

### Regression testing policy

Every confirmed bug gets a regression test:

```
Reproduce → Root cause → Failing test → Fix → Test passes
          → Run suite → Review → Update docs → CI → Merge
```

1. Reproduce the problem.
2. Identify the root cause — "flaky" is not a root cause.
3. Choose the **lowest** level that provides real protection. Do not write an
   E2E test when a unit test suffices.
4. Write the failing test **before** the fix.
5. Fix, confirm the test passes, run the surrounding suite.
6. Ship the test in the same PR as the fix.

If automated coverage is impractical, document why, how the behaviour will be
verified instead, and whether manual QA is required.

---

## A test must prove its own premise

A test that never triggers the thing it asserts passes for the wrong reason,
and reports safety it does not provide. This has happened here more than once.

**Before keeping a regression test, break the fix and watch the test fail.**
If it still passes, it is not testing what its name says.

Where a test depends on a precondition it sets up itself — an intercepted
request, a mocked rejection, a fake clock — assert the precondition too:

```ts
// The covers are Unsplash URLs with no file extension, so a
// `**/*.{png,jpg}` pattern matched nothing and the route never fired.
let imagesBlocked = 0;
await page.route("**/*", (route) => {
  if (route.request().resourceType() !== "image") return route.continue();
  imagesBlocked += 1;
  return route.abort();
});
await expect.poll(() => imagesBlocked).toBeGreaterThan(0);
```

Two local conditions make false passes easy here, and neither exists in CI:

- **The sandbox blocks outbound requests.** Anything remote fails on its own,
  so a test that expects a failed fetch passes without arranging one.
- **Piping a command to `tail` or `head` masks its exit code.** `npm test |
  tail -5` reports success from `tail`. Never read a pass/fail from a pipeline.

---

## Measure in a browser; do not reason about layout

Three defects this project shipped were invisible in the source and obvious in
one measurement:

- `<main>` carried an animation filling `both`, which left an identity
  `transform` on it forever. That makes the element the containing block for
  every `position: fixed` descendant, so a sheet meant to sit at the bottom of
  a 812px screen was laid out at y=3268 inside a 6583px-tall backdrop. Three
  rounds of patching individual modals had not touched the cause.
- `lg:hidden` and `inline-flex` on the same element both set `display`, so the
  winner was whichever Tailwind emitted last. It emitted `inline-flex`, and a
  control meant to be mobile-only stayed on desktop.
- A guide "too dense for mobile" was 9857px tall at 375px — twelve screens.
  Knowing the number decided what to collapse and proved the fix worked.

So: when the question is about position, size, visibility or breakpoints, open
a browser and read the numbers.

```bash
npm run build && node dist/server.cjs &     # background; the dev server
                                            # reloads on every file write
PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test
```

`page.evaluate(() => el.getBoundingClientRect())` answers in one call what a
paragraph of reasoning about CSS does not.

**Never put a breakpoint utility next to another utility that sets the same
property.** Give the breakpoint its own wrapper element.

---

## Silent fallbacks, again

Constraint 5 says do not add them. They keep appearing in the same shape: code
that answers a question it could not really answer, and looks fine doing it.

Found here, all with the same signature:

| Where | What it did instead of failing |
| --- | --- |
| `AuthModal` catch branch | fabricated a signed-in user when the popup failed |
| Deadline filter | read `daysLeft`, a field no record carries, and matched everything |
| Option counts | counted the whole catalogue while the list was filtered |
| `isUrgent` | a flag written once at creation, still calling closed calls urgent |
| Calculator currency | hardcoded `COP`, ignoring the currency the visitor chose |

The tell is a value produced from the wrong source, or from no source, where
the interface then presents it with full confidence. When you touch a screen,
check where each number and each string on it actually comes from.

**Never fabricate an identity, a session, or a record.** If authentication did
not happen, the visitor is anonymous — which is already a supported state.

---

## Clean code in every pull request

Leave the code you touched better than you found it, within the scope you were
given:

- Delete what the change makes dead — state, helpers, imports, whole files.
  A removed feature that leaves its icons imported fails lint as an *error*,
  not a warning, and blocks CI.
- Extract a shared unit when the second copy appears, not the first.
- Name the thing after what it is for. `LOAD_BATCH_SIZE`, not `6`.
- One definition of a rule. When a predicate is written twice — once for the
  list and once for the counts beside it — they drift, and the interface starts
  lying about its own behaviour.
- Comment the surprise, never the syntax. "Why `backwards` and not `both`"
  earns its lines; "increment the counter" does not.

This does not license unrelated refactoring. The scope is still the scope.

---

## Raise coverage with every pull request

Coverage is a ratchet, not a target — but the ratchet has to move.

Every pull request that adds behaviour also raises the thresholds in
`vitest.config.ts` to what the suite now reaches. Never lower them to make a
build pass; write the test instead.

Cover the component you touched properly rather than sprinkling assertions
widely. The screens still thin: `Footer`, `HeroLanding`, `ChatIA`,
`MapaConsulados`, `Comunidad`.

---

## Two branches on the same region

Branch per unit of work is not enough on its own: two branches can still be
open against the same component, and a clean `git merge` will interleave them
into something that compiles and is wrong. It has happened twice here — once
producing a filter panel that rendered chips *and* the native selects they
replaced.

- Before starting, check what is open against the file you are about to change.
- When two branches rewrite the same region, **stop and decide which lands
  first**, rather than resolving conflicts hunk by hunk. Say plainly which is
  more correct and why.
- Resolve a structural conflict by rewriting the region as one piece from the
  version that should win — not by picking sides line by line.
- After any merge into a component, open it in a browser. A merge that git
  called clean can still render two interfaces at once.

---

## Definition of Done

Written code is not done.

**Every task:**

- [ ] Acceptance criteria satisfied
- [ ] Scope respected — nothing extra changed
- [ ] Tests added or updated; relevant suite passes
- [ ] `npm run lint` and `npm run format:check` pass
- [ ] Documentation updated where the change made it inaccurate
- [ ] Self-review completed

**Additionally, for UI changes:**

- [ ] Responsive at 375px and desktop
- [ ] Loading, empty and error states handled
- [ ] Keyboard reachable, focus visible, controls labelled

**Additionally, for high-risk changes** (Risk: High or Critical, or anything
touching auth, data, secrets or deployment):

- [ ] Rollback strategy stated
- [ ] Security implications reviewed against `docs/security.md`
- [ ] **Human review obtained**

---

## Code quality

Follow the conventions already in the file you are editing.

Prefer: readable code, simple solutions, small cohesive units, clear names,
explicit error handling, existing abstractions.

Avoid: speculative abstraction, premature optimisation, large rewrites, new
dependencies without justification.

**Do not refactor unrelated code.** No "while I'm here" cleanup. If you notice a
problem outside your scope, mention it in your report and suggest an Issue.

---

## Living documentation

Documentation is part of the product. Read before changing a system; check
accuracy after.

| If you changed | Update |
| --- | --- |
| Screens, flows, roles | `docs/product.md` |
| Structure, modules, data flow | `docs/architecture.md` |
| Collections, rules, write paths | `docs/data.md` |
| Auth, secrets, hardening | `docs/security.md` |
| Logging, error handling | `docs/observability.md` |
| Test strategy or suites | `docs/testing.md` |
| Semantics, ARIA, keyboard | `docs/accessibility.md` |
| Bundle, rendering, network | `docs/performance.md` |
| Navigation, states | `docs/ux.md` |
| Assistant, prompts, Gemini | `docs/ai.md` |
| Env vars, scripts, tooling | `docs/development.md` |
| Deploy, backups | `docs/deployment.md` |
| Workflows, gates | `docs/ci-cd.md` |
| Metadata, crawlability | `docs/seo.md` |

Update the existing document rather than adding a new one. Documentation updates
ship in the **same PR** as the change.

If you deliberately do not update a document, say why in your report.

---

## Reviewing your own work

Generated code is not correct by default. Before reporting, review your own diff
as if someone else wrote it:

- Does it handle edge cases, or only the happy path?
- Are there hidden assumptions?
- Does it introduce complexity that is not earned?
- Do the tests actually assert behaviour, or only that nothing threw?
- **Is the integration complete?** This project's characteristic failure is a
  well-written piece whose end-to-end path was never verified: a client with no
  Firestore rule, a cron that persists nothing, a CSS class never defined, a
  breakpoint never declared. Check the whole chain, not just your file.

---

## When to stop and ask

Stop when: requirements are ambiguous · approaches have significant trade-offs ·
production data could be affected · security risk is high · a destructive
operation is required · the change conflicts with the architecture · acceptance
criteria contradict each other · correct behaviour cannot be determined from
evidence · the work exceeds approved scope.

Do not guess when the consequences are significant.

---

## Final report

Keep it short.

```
Summary:        What changed and why
Files:          Which files
Tests:          What was run, and the result
Verification:   How the behaviour was proven
Risks:          What remains
Documentation:  What was updated, or why it was not
Follow-up:      Unrelated problems found (not fixed)
```

Report outcomes honestly. If tests fail, say so with the output. If a step was
skipped, say which.

---

## Commands

```bash
npm run dev              # Express + Vite on :3000
npm run lint             # ESLint + tsc
npm run format:check     # Prettier (CI gate)
npm run test:coverage    # Unit tests + thresholds
npm run test:e2e         # Playwright, desktop + mobile
npm run build
```

### Running Playwright in the agent container

The pinned Chromium is not downloadable here; the container ships its own.

```bash
npm run build
node dist/server.cjs &   # not `npm run dev`: Vite watches the test files and
                         # reloads the page mid-run, failing the suite
PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test
```

`playwright.config.ts` reads `PLAYWRIGHT_CHROMIUM_PATH` and passes it as
`executablePath`. It is unset in CI, where `npx playwright install` runs.
Do **not** add a second Playwright config to the tree for this; it was tried,
and the `any`s it introduced pushed the lint budget over its ratchet.

Specs matching `*.mobile.spec.ts` run on the phone project. A desktop
assertion inside one goes in its own `describe` with
`test.use({ viewport: … })`.

Merge gates and branch protection: `CONTRIBUTING.md`
