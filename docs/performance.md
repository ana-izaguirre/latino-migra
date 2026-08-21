# Performance

Measured and observed characteristics of the current build.

## Measurements

| Metric | Value | Source |
|---|---|---|
| JavaScript bundle | 1,620 KB (≈433 KB gzipped) | `vite build` output |
| CSS bundle | 123 KB | `vite build` output |
| Static datasets in bundle | 135 KB | `src/data/` |
| Code split points | 0 | no `React.lazy` or dynamic imports |
| INP | ~80 ms | Vercel Speed Insights (good band is ≤200 ms) |
| Slowest observed interaction | 40–80 ms | country buttons in the guides |
| Images with `loading="lazy"` | 1 of 8 `<img>` | source |
| Remote image URLs | 44 (images.unsplash.com) | source |
| `useState` in components | 148 | source |
| `useMemo` / `useCallback` / `React.memo` | 9 / 0 / 0 | source |

Vite emits its "chunks larger than 500 kB" warning on every build.

## Bundle composition

Everything ships in one chunk: all ten screens, all six datasets, the Firebase
SDK, the Google Maps wrapper and the icon library. A visitor who only wants the
scholarship catalogue downloads the planner, the calculator, the forum, the map
and 48 KB of visa guides for seven countries.

`migrationGuides.ts` alone is 48 KB and is fully parsed to display one country.

### Radix, and what it cost

Adopting the shadcn/ui primitives added **131 KB raw / 45 KB gzipped** —
measured, not estimated: `vite build` on the parent commit produced
1,489.17 KB (387.97 KB gzipped) and 1,620.30 KB (433.03 KB gzipped) after.
That is 11.6% more gzipped JavaScript, and it buys the dialog, listbox and tab
behaviour described in `docs/accessibility.md`.

Most of it is `@radix-ui/react-select`, which pulls in the popper, focus-scope
and dismissable-layer packages. `Button`, `Badge`, `Card` and `Input` cost
almost nothing; `class-variance-authority`, `clsx` and `tailwind-merge` are
about 4 KB together.

Since everything ships in one chunk, every visitor pays this on first load
whether or not they open the Becas screen. That makes the code splitting
already recommended below more valuable than it was, not less — the primitives
belong in whichever chunks use them.

## Dependency weight

- `motion` (804 KB, zero imports) has been removed, as has the duplicate `vite`
  entry in `dependencies`.
- `@vitejs/plugin-react` and `@tailwindcss/vite` are still listed in
  `dependencies` rather than `devDependencies`, so they are installed in
  production and pulled into the serverless function's dependency resolution.

## Rendering

With 148 `useState` against 9 `useMemo` and no `React.memo` or `useCallback`,
each state change re-renders the full component subtree. In the four
1,000-line components that subtree is large.

`PlanificadorMigracion` rebuilds its migration step list from
`originCountry`, `destinationCountry` and `pathway` on each render of that
effect. `GuiaMigracion` re-renders the whole guide when the selected country
changes, which is what Speed Insights records as the 40–80 ms interactions.

## Network

- Firestore queries are mostly bounded (`fetchScholarshipsFromDB` at 100,
  community posts paginated). Five of eight `getDocs` calls have no `limit()`.
- 44 images load from `images.unsplash.com` with sizing parameters in the URL.
  Each card depends on a third party to render, with no cache control and no
  availability guarantee. This is also why the CSP must allow `https:` broadly
  in `img-src`.
- The Google Maps SDK loads on the consular screen.
- No service worker, so no offline capability or asset precaching.

## Caching

- Static assets are served by Vercel's CDN with its default headers.
- `vercel.json` sets security headers but no explicit `Cache-Control`.
- No application-level caching beyond the in-memory fallbacks in
  `src/lib/firebase.ts`.

## Loading states

52 loading indicators across the components, so perceived performance during
data fetches is handled. The gap is error states (2), not loading.

## Assessment

Real user metrics are in the good band, so performance is **not currently a user
problem**. It is unhedged debt: the bundle grows with every screen added, and
nothing in CI measures it. The three largest levers, in order of effect, are
route-level code splitting, removing the unused and misplaced dependencies, and
loading guide data per country instead of all seven.
