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

## Cost of living calculator

- The target currency is the shared preference, read through `useCurrency()`,
  and picking one inside the calculator writes it back — the same two-way
  behaviour the country selector already had. The screen used to keep a
  private `useState("COP")` and never read the preference at all, so a
  visitor who chose Lempiras was answered in Colombian pesos.
- Conversion goes through the shared EUR-based table in `src/lib/currency.ts`.
  The calculator carried a second table of its own with ten currencies to the
  application's sixteen, and the seven it lacked — HNL, GTQ, BOB, CRC, DOP,
  UYU, GBP — fell through `|| FX_RATES_FROM_USD["COP"]` and were answered in
  pesos without a word.
## What the navigation offers

- The product is narrowed to Becas and Guías. The planner, the calculator,
  volunteering, the community and the feedback hub are no longer linked from
  the top bar, the drawer, the bottom bar or the footer.
- They are **hidden, not deleted**: the components, their data and their tests
  are untouched and still compile. `src/lib/navigation.ts` holds the single
  list, so restoring a screen is deleting one line rather than editing four
  components.
- The desktop "Herramientas" menu held only hidden screens for a
  non-administrator, so it no longer renders at all rather than opening onto
  an empty panel.
- Navigation is `useState` in `App.tsx` with no router, so a hidden screen has
  no URL to arrive by and is genuinely unreachable — which is also why the
  end-to-end tests that drove those screens were removed rather than adapted.
## The first screen

- Two destinations, side by side at every width. Three wide buttons wrapped
  onto three full-width lines at 375px and read as stacked blocks rather than
  a choice — and the third led to the planner, which the navigation no longer
  offers.
- No catalogue figures. The badge claimed "+5,000 Becas Activas" against a
  catalogue of 22, on the one screen whose job is to say what the product is.
  Numbers about the catalogue belong on the catalogue, where they are counted
  rather than asserted.
- Nothing here links to a hidden screen. The planner card is gone with the
  planner.

## Scholarship list

- One way through the catalogue. The screen carried a numbered pager and a
  "load more" button behind a mode switch, plus a page-size selector — three
  controls doing one job, and on a phone the numbered pager was a row of tap
  targets nobody asked for. Lazy loading is what remains: `LOAD_BATCH_SIZE`
  convocatorias at a time, a progress bar that announces itself, and an
  explicit end state.
- Changing a filter resets to the first batch. What was loaded before the
  change says nothing about what matches after it.
- A cover image that fails to load renders a labelled placeholder rather than
  the browser's broken-image glyph, which reads as the application being
  broken instead of one picture being gone.
  `src/components/ui/ImageWithFallback.tsx`. An empty `src` counts as a
  failure: the browser would otherwise resolve it against the page URL and
  fetch the document itself.

## Scholarship detail

- Requisitos and beneficios collapse below `lg` through the same `Disclosure`
  the guides use. Together they are the bulk of the panel and arrived as one
  wall of text.
- The calendar action says what it does. "Agendar en Google Calendar" read as
  booking an appointment with somebody; nothing is booked with anyone, so it
  is "Recordarme la fecha límite", and the event that lands in the reader's
  calendar is titled "Recordatorio: cierra la beca …".
- One link to the official call, not two. The header and the action row both
  pointed at the same page.
- The "Consultar IA" button is hidden behind
  `SHOW_ASK_AI_ABOUT_SCHOLARSHIP`, not deleted: the assistant cannot yet
  answer usefully about one specific call, and the handler, the prop and the
  path through `App` stay wired so restoring it is one word.

## Home

- The first screen shows what the product holds rather than describing it: the
  three convocatorias closing soonest, every guide country with its number of
  visa routes, and the studies catalogue's size with three of its programmes
  named. It was three cards of prose, so a visitor could not see that the
  catalogue existed without navigating into it (#86).
- **No total is claimed for the scholarships.** The catalogue screen loads from
  Firestore and the first screen does not, so a figure stated here could
  contradict the figure stated there. #46 removed an invented "+5,000 Becas
  Activas"; a number that is merely often wrong is the same defect, smaller.
  The guides and the studies ship bundled, so their counts cannot drift and are
  given exactly.
- A call whose deadline has passed is never previewed. The comparison is against
  today rather than a stored flag — `isUrgent` was written once at creation and
  still called closed calls urgent.
- The assistant is described rather than previewed: it answers per question, so
  there is nothing real to show, and a sample exchange is what the chat screen
  itself used to fabricate (#4).
- Measured at 375px: 7350px before, 8078px after. The screen is long, and the
  hero is most of it — worth its own look.

## Estudios (cursos, certificados y FP)

- The Becas & Estudios screen carries a fourth tab, **Cursos, Certificados y
  FP**, holding the study routes that do not depend on funding (#56).
  `src/components/EstudiosSection.tsx`.
- Selecting it hides the scholarship chrome — search, sort, the filter sidebar
  and the mobile quick filters — because none of it filters what is on screen.
  A sort control that sorts nothing is an interface lying about its behaviour.
- Each entry is a `Card`, and the requirements and qualification collapse below
  `lg` behind the same `Disclosure` the guides and the scholarship detail use.
  The official-source button is never inside the collapse: it is why the entry
  exists.
- The list pages in sixes through one control, matching the scholarship list
  beside it. Measured at 375px it is 5390px against the catalogue's 5403px;
  rendering all thirteen at once was 9463px.
- The tab badge counts what the section will render, not what the dataset
  holds: an entry without an official source does not appear, and a badge
  counting entries rather than results is a defect this screen already had.
- An entry that fails the official-source check is reported above the list, not
  dropped. `src/lib/studyProgrammes.ts` holds the rule and the domain
  allowlist. Spec: `specs/estudios-catalogue.md`.

## Migration guides

- The guide collapses its heavy blocks below `lg` and leaves them open above
  it. Measured at 375px, the screen ran to 9857px — twelve screens of
  scrolling to reach the anti-scam section at the bottom; it is 6519px now.
  Three blocks collapse: each visa card's requirements and actions, the
  document checklist, and the anti-scam guide.
- The split is done in CSS, not by measuring the viewport in JavaScript. The
  panel is always in the DOM and always shown at `lg`; the control that
  toggles it is hidden there, so `aria-expanded` never claims something is
  collapsed on a screen where it is not. `src/components/ui/Disclosure.tsx`.
  The breakpoint sits on a wrapper rather than on the control itself:
  `lg:hidden` and a display utility on one element let the emitted order pick
  the winner, and it picked `inline-flex`.
- The migration route no longer marks a phase as the one you are on.
  `activeRoadmapStep` started at 2, so phase two was flagged as current for
  every visitor on every load, and tapping a card moved a marker that meant
  nothing — the application does not know where anyone is in their process.
  It renders as an ordered list, with the phase number in the heading for a
  screen reader and the digit badge left decorative.
- Each visa carries a visible link to its official source. It used to be a
  grey text link between a vote counter and an AI button, on a screen whose
  whole claim is that it points at official sources. A visa with no source
  says so rather than showing nothing.

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
