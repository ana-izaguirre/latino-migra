# Accessibility

Status against WCAG 2.2 AA. Measured from the source, not from an automated
audit tool — no such tool runs in CI today.

## Summary

The application is usable with a mouse and a screen, and largely **unusable with
a screen reader**. Recent work fixed touch ergonomics, which are visible. The
semantic layer, which is not visible, remains largely unaddressed.

## Per-criterion status

| Criterion | Status | Evidence |
|---|---|---|
| 1.3.1 Info and relationships | **Fails** | Two `<h1>` on the home screen (`HeroLanding` + `BecasExplorer`). 24 `<input>` elements and a single `htmlFor` in the whole codebase |
| 1.4.3 Contrast | **Needs measurement** | Frequent `text-[10px]` and `text-[11px]` on tinted backgrounds; not yet measured |
| 1.4.4 Resize text | Passes | Relative units throughout; no fixed-height text containers |
| 1.4.10 Reflow | Passes | Verified by E2E: no horizontal document scroll on any screen at 390 px |
| 2.1.1 Keyboard | **Partial** | Menus and the mobile drawer close on Escape. Modals do not trap focus and mostly cannot be dismissed by keyboard |
| 2.3.3 Animation from interactions | Passes | `prefers-reduced-motion` honoured in `src/index.css` |
| 2.4.7 Focus visible | Passes | Global 3 px `:focus-visible` ring in `src/index.css` |
| 2.5.5 Target size | Passes | 44 px minimum on touch layouts, enforced by E2E assertions |
| 3.3.2 Labels or instructions | **Fails** | Form controls rely on placeholders; almost no associated `<label>` |
| 4.1.2 Name, role, value | **Fails** | 12 `fixed inset-0` modal overlays; 2 declare `role="dialog"`, 1 declares `aria-modal` |
| 4.1.3 Status messages | **Fails** | Zero `aria-live`, `role="status"` or `role="alert"` anywhere |

## What is in place

- A single global focus ring, added after several components had cleared the
  default `outline` without replacing it.
- 44 px minimum touch targets on layouts under 1024 px, with E2E tests that fail
  if a control shrinks below 40 px.
- 16 px minimum font on form controls under 1024 px, which prevents iOS from
  zooming the page on focus.
- `prefers-reduced-motion` short-circuits all animations and smooth scrolling.
- `aria-label` on icon-only navigation controls (menu toggle, theme, alerts,
  account) and `aria-current="page"` on the active navigation item.
- `aria-haspopup` and `aria-expanded` on the desktop tools and preferences menus.
- The mobile drawer declares `role="dialog"`, `aria-modal` and an `aria-label`.
- Escape closes the drawer and both desktop menus.
- Semantic landmarks: `<nav>`, `<main>`, `<header>`, `<footer>` are used.

## Dialogs

All dialogs render through `src/components/ui/Modal.tsx`, on Radix's dialog
primitive. That supplies the focus trap, `Escape`, the portal, `aria-modal` and
the `aria-labelledby`/`aria-describedby` wiring — none of which the twelve
hand-written overlays had between them. With one open, the page behind is
hidden from assistive technology and unreachable by Tab.

Focus return is handled in the component rather than by Radix: every dialog is
controlled from an external button rather than a `Dialog.Trigger`, so Radix had
nothing to restore to and focus fell to `<body>`. The component remembers what
was focused when the dialog opened.

A custom `header` renders its own visible heading, so the accessible name is a
visually hidden `span` rather than a second heading with the same text.

## What is missing

**Form labels.** 24 inputs, one `htmlFor`. Screen readers announce "edit box"
with no indication of what it is for. This affects the scholarship search, the
cost calculator, the forum composer, the feedback form and the alert settings.

**Status messages.** No live regions of any kind. Every asynchronous message —
sync results, publish errors, loading completion, the language-change toast —
is invisible to assistive technology. There are 52 loading indicators and none
announce anything.

**Modal semantics and focus management.** Nine components implement their own
overlay. Focus is not moved into the dialog on open, not trapped while open, and
not returned on close. Most cannot be closed with Escape. Background content is
not hidden from the accessibility tree.

**Heading structure.** The home screen has two `<h1>`. Section headings are
mostly `<h2>`/`<h3>` but nesting has not been verified against content order.

**Native `alert()`.** Three error paths in `Comunidad.tsx` use browser alerts,
which interrupt flow and give no context.

## Tooling

`eslint-plugin-jsx-a11y` is configured in `eslint.config.js` with five rules as
errors: `alt-text`, `anchor-has-content`, `aria-props`, `aria-role`,
`role-has-required-aria-props`. These pass.

The rules that would catch the failures above — `label-has-associated-control`,
`no-static-element-interactions`, `click-events-have-key-events` — are not
enabled.

No `axe-core` check runs in CI, so none of the failures listed here would be
caught by the test suite.

## Why this matters for this product

The audience includes people navigating an unfamiliar bureaucracy in a second
language, often on modest devices, and including people with disabilities. The
information here — visa requirements, consular addresses, scam warnings — is the
kind that has real consequences when it is inaccessible. This is a barrier to
service, not only a conformance gap.
