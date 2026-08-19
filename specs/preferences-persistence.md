# Preferences persistence

Issue: [#40](https://github.com/ana-izaguirre/latino-migra/issues/40)

## Problem

Theme, language, currency and the two country choices live in `useState` and
reset on every reload. Nothing is persisted because nothing may be written to
`localStorage` or `sessionStorage`, and no alternative was ever built.

The country choice is the costly one: it drives the scholarship filter, the visa
guides and the consular map, and re-selecting it is the most tedious thing a
returning visitor has to do.

## Goals

- A reload keeps all five preferences, signed in or not.
- A signed-in user's preferences follow them to another device.
- A visitor can erase everything the app remembers about them, in one action.

## Non-goals

- Persisting anything else. Search terms, filters, scroll position and draft
  forum posts stay in memory.
- Server-side rendering of the stored theme. The page will still paint the
  default for one frame before the stored value applies.
- Cookie consent UI. See *Security and privacy*.

## Requirements

| Visitor | Backend |
|---|---|
| Signed in | `userPreferences/{uid}` in Firestore. Nothing in the browser. |
| Anonymous | The `lm_prefs` cookie. |

Signing in migrates the cookie's values into Firestore and deletes the cookie,
so a language chosen before signing in survives. Signing out clears the
in-memory state back to defaults and writes nothing — one user's preferences
must never become the next visitor's.

Persisted keys: `theme`, `language`, `currency`, `originCountry`,
`destinationCountry`.

A **Clear my preferences** control empties both backends and restores defaults.

## Constraints

`CLAUDE.md` constraint 1 forbids browser storage. This narrows rather than
removes it: for a signed-in user the guarantee gets *stronger* — their
preferences leave no local trace at all. The cookie is an anonymous-only
exception. `src/test/noBrowserStorage.test.ts` keeps failing on any
`localStorage` or `sessionStorage` use.

## Design

`src/lib/preferencesStore.ts` owns persistence. The four existing contexts stay
where they are and gain two lines each: seed from the store, write on change.
Restructuring them into one provider would be a larger change than the feature
warrants.

The store holds the active user id, set by `App.tsx` when auth resolves. Reads
and writes route to Firestore when it is set and to the cookie when it is not.
Writes are debounced, because changing a country fires several updates.

## Edge cases

- **Corrupt cookie.** Parse failures discard the cookie and fall back to
  defaults rather than throwing on boot.
- **Unknown values.** A stored currency or language no longer supported is
  ignored per-key, not treated as a corrupt payload.
- **Firestore unavailable.** Reads fail closed to defaults and are logged. The
  app must not block on the network before it renders.
- **Sign-in with preferences on both sides.** The cookie wins for keys the
  visitor just changed; Firestore keeps the rest. Merging beats discarding.
- **Cookie size.** Five short keys, well inside the 4 KB limit.

## Security and privacy

The cookie holds five display preferences and nothing else: no identifier, no
personal data, nothing that could correlate a visitor across sites. It is
`SameSite=Lax`, `Secure`, one year, and readable by JavaScript because the
client is what reads it.

Under GDPR/ePrivacy, a preference the user themselves set is exempt from the
consent requirement — no banner is needed for this. Adding an analytics cookie
later would change that.

The Firestore path already exists with an owner-scoped rule, so a user can only
read and write their own document.

## Testing

Unit: cookie round-trip, corrupt and partial payloads, Firestore round-trip,
the sign-in migration, the clear path, and that neither backend is written for
the wrong visitor type.

E2E: reload keeps language and theme; clearing restores defaults; nothing is
written to `localStorage` or `sessionStorage` at any point.
