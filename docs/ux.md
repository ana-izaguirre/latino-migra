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
- The page scrolls while a modal is open, and stops moving underneath it. Every
  overlay is `fixed inset-0`; nothing froze the document beneath, so a swipe
  scrolled the page while the panel stayed put and the screen read as stuck.
  `useBodyScrollLock` (`src/lib/`) pins the body and restores the reading
  position on close — the same mechanism the drawer already used, now shared by
  all ten overlays.
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
