# UX

Current interaction design, as built.

## Navigation

Ten destinations. The structure differs by viewport.

**Desktop (≥1024 px)** — four primary links inline (Becas, Guía de Migración,
Mapa Consular, Chat IA), a **Herramientas** menu for the remaining six
destinations, and a **Preferencias** menu holding currency, language and theme.

This replaced ten inline items that overlapped each other and the account
controls at common widths, and three unlabelled utility controls.

**Mobile (<1024 px)** — a fixed bottom bar with Inicio, Becas, Guías, Chat IA
and Menú. The drawer holds every destination plus currency, language and theme.
Before the bottom bar existed, changing screens cost three taps.

There are no URLs, so navigation state cannot be shared, bookmarked, or reached
with the browser's back button.

## Information architecture overlaps

Three places where two things do the same job:

1. **Scholarships appear twice.** The `home` tab mounts `HeroLanding` **and** the
   complete `BecasExplorer`, with filters, pagination and modals. The `becas`
   tab mounts the same component with the same props. Nothing distinguishes the
   two views.
2. **Planner and calculator overlap.** Both compute a migration budget and both
   offer "Consultar IA". A user wanting to know how much money they need has no
   basis for choosing.
3. **Scholarships and volunteering share a pattern.** Both are filtered
   catalogues with chips, cards and a detail modal, implemented separately.

The footer also repeats most navigation destinations in four columns.

## Interaction states

| State | Count | Assessment |
|---|---|---|
| Loading | 52 indicators | Well covered |
| Empty | 7 | Present on the main lists |
| Error | 2 rendered | **Thin** — most failures are silent or use `alert()` |
| Confirmation | 0 | "Sincronizar base de datos" overwrites the entire catalogue without asking |
| Onboarding | 0 | No guided first run despite ten tools |

The ratio of 52 loading indicators to 2 error states describes the dominant
pattern: **the app communicates well when it works and says nothing when it
fails.** Combined with the static fallbacks in the data layer, a user can be
reading outdated content that looks current.

## Feedback

- Language changes show a transient toast.
- Sync operations show inline status text in the admin and catalogue screens.
- Three error paths in `Comunidad.tsx` use native `alert()`, which is jarring and
  offers no recovery.
- No toast or notification system exists; feedback is implemented per screen.

## Mobile

Recently addressed and verified by tests:

- No horizontal scrolling on any screen. Previously the top bar rendered 543 px
  of content in a 390 px viewport, which forced sideways scrolling everywhere and
  made the browser shrink the whole page.
- Sign-in, theme, currency and language controls are reachable. They were
  previously off-screen.
- 44 px touch targets and 16 px form fonts.
- The floating chat collapses to a circular button so it stops covering the
  primary call to action, and clears the bottom bar.
- Range sliders have a visible, draggable thumb. They previously used
  `appearance-none` with no thumb styling, leaving them invisible.
- Theme, language, currency and both country choices survive a reload.
  Anonymous visitors keep them in the `lm_prefs` cookie; signed-in users keep
  them in Firestore and nothing in the browser, so they follow the account to
  another device. Signing in migrates the cookie and deletes it. A **Clear my
  preferences** control in the preferences menu empties both.
- Every dialog is one component, `src/components/ui/Modal.tsx`, built on
  `@radix-ui/react-dialog`. A sheet rising from the bottom edge on a phone, a
  centred dialog on a pointer device. Eleven of the twelve hand-written overlays
  are gone; the twelfth is the navigation drawer, which is a different shape and
  keeps its own implementation.
- Focus is trapped inside an open dialog and returns to the control that opened
  it. Neither was true of any overlay before.
- The scholarship catalogue says where its list came from. The bundled dataset
  renders immediately and Firestore replaces it, which used to happen silently —
  and a failed load was indistinguishable from a successful one. A polite live
  region now reports "Actualizando convocatorias…" while the fetch is in flight
  and, if it fails or returns nothing, says the list on screen is the bundled
  copy and may be out of date.
- Modal close buttons sit in the top-right corner. `.btn-tactile` in
  `index.css` set `position: relative` and, being unlayered, beat Tailwind's
  `.absolute` at equal specificity — both close buttons rendered in static flow
  at the top-left of their panel. The rule now lives in `@layer components`, so
  a utility on the same element wins.
- The close button stays in the corner while a long panel scrolls. The
  scholarship detail panel caps itself at 90vh and scrolls internally, so an
  absolutely positioned button scrolled away with the content and the only way
  out of a long entry was to scroll back up. It is sticky now. `.lm-overlay`
  also no longer forces `max-height: none` onto the panel, which had been
  overriding that 90vh cap.
- The page scrolls while a modal is open, and stops moving underneath it. Every
  overlay is `fixed inset-0`; nothing froze the document beneath, so a swipe
  scrolled the page while the panel stayed put and the screen read as stuck.
  `useBodyScrollLock` (`src/lib/`) pins the body and restores the reading
  position on close — the same mechanism the drawer already used, now shared by
  all ten overlays.
- Overlays are positioned against the viewport, not against the page. `<main>`
  carries `.animate-fade-in`, whose animation used to fill `both`; a filling
  animation keeps contributing its final `transform`, and Chromium resolves the
  keyword `none` to the identity matrix, which is still a transform. Any
  transform makes the element the containing block for its `position: fixed`
  descendants, so every overlay in the application was laid out against the
  full height of the page. Measured at 375px: a filter sheet meant to sit at
  the bottom of the screen was placed at y=3268 inside a 6583px-tall
  "fixed inset-0" backdrop, which is why modals kept appearing far below the
  fold on a phone. Every animation in `index.css` that touches `transform` now
  fills `backwards`; the two opacity-only ones keep `both`, since opacity
  creates no containing block. `tests/e2e/mobile.spec.ts` pins both the
  position and the mechanism.
- Overlays carry `.lm-overlay`, which gives them a scroll container. Flex
  centring clipped a panel taller than the viewport at both ends with no way to
  reach the overflow; `align-items: flex-start` plus auto margins centres it
  only while it fits.
- The root uses `overflow-x: clip` rather than `hidden`. `hidden` makes the
  element a scroll container, which breaks `position: sticky` inside it and
  disables momentum scrolling on iOS.
- Dismissing the drawer restores the reading position instead of jumping to the
  top.

## Visual hierarchy

- Type scale and spacing are consistent within screens.
- A layered shadow scale distinguishes cards, popovers and modals, replacing
  uniform hairline borders on a near-white ground.
- Icons carry semantic colour per destination, applied consistently between the
  desktop menu, mobile drawer and footer.

## Cognitive load

Dense screens present everything at once: the scholarship catalogue exposes six
filters simultaneously; the planner shows budget and checklist together. For an
audience that includes people with low digital literacy, a sequenced flow — one
decision at a time — would fit better. This is a sequencing question about
existing content, not a redesign.

## Known interaction defects

| Screen | Defect |
|---|---|
| Mapa Consular | Filters, map and list stack vertically, forcing scrolling on desktop where they would fit in one view |
| Chat IA | The view jumps to the bottom on open, because `scrollIntoView` runs on first render against a seeded conversation that already has messages |
| Home | Two `<h1>`, and the full catalogue renders twice per visit |
| Becas | "Sincronizar base de datos" overwrites the catalogue with no confirmation or preview |
| Comunidad | Native `alert()` on three error paths |
