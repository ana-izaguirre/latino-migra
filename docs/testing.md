# Testing

Current test suites, what they cover and where they mislead.

## Suites

| Suite | Runner | Files | Tests |
|---|---|---|---|
| Unit / component | Vitest 4 (jsdom) | 15 | 65 |
| End-to-end | Playwright 1.62 | 4 | 29 |

Coverage: **43.17 % statements, 43.40 % branches, 36.17 % functions,
43.27 % lines** (v8 provider).

## Commands

```bash
npm run test           # vitest run
npm run test:unit      # same
npm run test:watch     # vitest
npm run test:coverage  # with thresholds enforced
npm run test:e2e       # playwright, desktop + mobile projects
npm run test:e2e:full  # FULL_E2E=true — adds firefox, webkit, iPhone 12
npm run test:e2e:ui    # interactive
```

## Playwright projects

Desktop and mobile are separate projects so neither suite runs against a layout
it was not written for:

- **chromium** (Desktop Chrome) — everything except `mobile.spec.ts`
- **Mobile Chrome** (Pixel 5) — only `mobile.spec.ts`

`PLAYWRIGHT_CHROMIUM_PATH` overrides the browser binary for environments that
ship their own Chromium. `PLAYWRIGHT_TEST_BASE_URL` overrides the target URL.

## What is genuinely covered

**Mobile layout regressions** (`tests/e2e/mobile.spec.ts`) — the strongest part
of the suite. Each test pins a defect that actually shipped:

- No horizontal document scroll on any of the ten screens.
- Layout viewport equals device width (catches shrink-to-fit).
- Account, alerts and menu controls render inside the viewport.
- Bottom-bar navigation reaches the main screens in one tap.
- Drawer opens from the bottom bar, closes on Escape, restores scroll position.
- Form controls compute to ≥16 px so iOS does not zoom on focus.
- Navigation and account controls are ≥40 px.
- No undersized controls on the home screen.
- The floating chat button is inside the viewport, clickable, and clear of the
  bottom bar.

**Cross-screen consistency** (`consistency.spec.ts`) — a destination picked in
the guides propagates to the planner and the consular map; the catalogue is not
pre-filtered before the user chooses; nothing is written to browser storage;
desktop navigation does not overlap the account controls; the tools and
preferences menus open, close on outside click, and reach their screens.

**Server behaviour** (`src/test/`) — rate limiter budget, 429 response, standard
headers, per-client separation; `CRON_SECRET` failing closed; chat input caps;
API security headers; `vercel.json` schema and routing rules.

**Domain data** (`latinomigra.test.ts`) — every translation key has both
languages; scholarships carry required metadata; guides exist for ES, DE, CA.

**Country context** (`PreferencesContext.test.tsx`) — propagation between
consumers, code/name mapping, no storage writes. 100 % covered.

## What is not covered

| Gap | Why it matters |
|---|---|
| Firestore rules | The three most serious data findings are all rule defects, and no test touches the rules. Requires the Firestore emulator. |
| Admin authorization | The role-elevation path would pass every current test. |
| `currency.ts` (5.6 % covered) | Pure logic affecting every amount the user sees. |
| `sanitize.ts` (50 %) | A security function, half tested. |
| `/api/chat` failure modes | No coverage of Gemini errors, timeouts or malformed responses. |
| Runtime console errors | No test fails when the app throws. A CSP change once prevented React from mounting entirely and only a manual check caught it. |
| Accessibility | Nothing checks labels, roles or live regions. |
| Visual regression | The desktop navigation overlap was not caught by any test. |

## Test quality issues

**A test that asserts nothing after acting.**
`src/components/GuiaMigracion.test.tsx:28` is named "allows clicking on checklist
documents to toggle status". It clicks and then makes no assertion. It passes
whether or not the toggle works.

**Mocking depth removes the thing under test.**
`src/test/setup.ts` mocks all of `firebase/firestore` with stubs returning empty
results. No unit test exercises a real data path, which is why `firebase.ts` —
808 lines and the most critical module — sits at 21 % coverage that validates
no behaviour.

**Text-coupled E2E selectors.**
Several E2E assertions match visible Spanish copy (`text=Directorio Oficial de
Becas`). Any wording change breaks them. Tests using stable `id` selectors are
unaffected; the mix is inconsistent.

**Provider-less rendering produced false positives.**
Component tests originally rendered without the context providers. When they
were wrapped in the real provider tree, five failed: they asserted i18n
*fallback* strings such as `"Becas"` that never render in production, where the
catalogue returns `"Becas & Estudios"`. Those expectations were corrected.
`src/test/renderWithProviders.tsx` now mirrors `main.tsx` and should be used for
any component test.

**E2E do not exercise the production path.**
`playwright.config.ts` starts the server with `npm run start`, which does not set
`NODE_ENV=production`. `server.ts` therefore takes the Vite development branch.
The 29 tests validate the dev server, not the built `dist/` output, so
production-only behaviour — static routing, the stricter production CSP, the SPA
fallback — is untested.

## Coverage thresholds

Defined in `vitest.config.ts` as a **ratchet**: set just below current numbers so
coverage cannot regress, raised as tests land. `src/lib/PreferencesContext.tsx`
carries a stricter per-file budget (95 % statements).

Coverage excludes config, scripts, test helpers and `main.tsx`.

A high global target is deliberately not set. The codebase is ~11,900 lines of
components against ~1,550 of pure logic, so a 95 % global threshold would mostly
measure whether JSX renders — thousands of lines of tests buying false
confidence and slowing every change. What works instead:

1. **High coverage where it counts.** `src/lib` is pure, verifiable logic.
2. **A global ratchet.** Coverage cannot fall, and rises with every PR that adds
   tests.
3. **Patch coverage.** New code arrives covered, enforced per PR without having
   to fix the whole backlog first.

Reasonable medium-term target: 70 % globally, `src/lib` above 90 % (#14).

## What is only testable manually

- Quality and accuracy of AI assistant answers.
- Correctness of migration content against official government sources.
- Comprehensibility for users with low digital literacy — this needs real users,
  not tooling.
