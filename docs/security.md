# Security

Current security posture. Findings are stated as facts about the code.

## Authentication

Firebase Auth with Google sign-in via popup (`signInWithPopup`). No password
handling, no custom session management. Tokens are stored by the Firebase SDK in
IndexedDB — outside the "nothing in browser storage" policy, which covers
application state only.

`subscribeToAuthState` in `App.tsx` reacts to auth changes and loads the profile
from `users/{uid}`.

## Authorization

Both checks read the same source:

| Layer | Check | Trusts |
|---|---|---|
| Client (`authUtils.ts`) | `user.isAdmin`, resolved once at sign-in from `admins/{uid}` | A collection no client can write |
| Firestore rules | `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` | The same collection |

`admins` has a read-own rule and **no write rule at all**, so the deny-all
catch-all rejects every create, update and delete from every client. Entries are
added from the Firebase console.

### Privilege escalation (fixed in #19)

`AuthModal` used to render "👤 Persona Normal" / "🔑 Administrador" buttons to
any signed-in user, the second calling
`onSignIn({ ...currentUser, role: "admin" })`. `isAdmin()` short-circuited on
`user.role === "admin"`, so that unlocked the admin tab and every admin-only
control.

Three things were wrong at once, and all three are closed:

1. The selector existed. It is gone; a component test asserts no control changes
   the role.
2. `isAdmin()` trusted a client-supplied field. It now reads only the flag
   derived from `admins/{uid}`.
3. `users/{uid}` accepted any field, so `role: "admin"` written directly with
   the SDK persisted and `App.tsx` read it back. The rule now allows only the
   six fields the app writes, and `App.tsx` no longer reads `role` at all.

A fourth path made it worse: the demo fallback in `AuthModal` signed a fake user
in as a real administrator's address whenever the Google popup failed, which the
email allowlist then accepted. The identity is now generic and the allowlist is
gone.

Data writes were never exposed — the scholarship rule validated the verified
email on the token, not the `role` field.

**Not covered by tests.** The `users` and `admins` rules have no automated
verification: the project has no Firestore emulator (`firebase.json`,
`@firebase/rules-unit-testing`). See `docs/testing.md`.

## Data access control

`firestore.rules` is the only enforced boundary — there is no server-side
validation of anything persisted.

**Sound:** deny-all catch-all, consistent owner scoping on the six private
collections, admin-only scholarship writes, size limits on user-generated text.

**Unsound:**

- `forumPosts`, `forumPosts/{id}/replies` and `feedbackSuggestions` allow
  `create` without `isSignedIn()`. The Firebase config ships in the client
  bundle, so anyone can write directly through the Firestore REST API, bypassing
  the app and every Express rate limiter.
- Those `create` rules do not validate `userId` or `author`, so posts can be
  attributed to another user.
- `allow update: ... hasOnly(['likes'])` restricts which keys change but not the
  value, and requires no authentication. `likes: 999999999` is accepted.
- `visa_guide_votes` has no rule and is denied by the catch-all.

## Secrets and environment

| Item | Status |
|---|---|
| `.env` | Not tracked by git |
| `lm_prefs` cookie | Anonymous visitors only. Five display preferences, `SameSite=Lax`, `Secure`, one year. No identifier, nothing personal, so no consent banner is required |
| Real API keys in the working tree | None found |
| Real API keys in git history | One leaked Google API key — see #16 |
| Firebase config in bundle | Yes — public by design for web SDKs |
| Fallback project ID in source | `refined-coral-0zp2g` hardcoded in `src/lib/firebase.ts` as a default |
| Admin emails in bundle | No — replaced by the `admins` collection in #19 |
| `GEMINI_API_KEY` | Server-side only, never sent to the client |
| `CRON_SECRET` | Server-side; fails closed when unset |
| Google Maps key | Client-side; referrer restrictions not documented |

The hardcoded fallback project ID is not a secret, but it does mean a developer
without `.env` silently connects to a real Firebase project.

This audit read the working tree, not the history. GitHub Secret Scanning
later flagged a Google API key committed in an earlier revision: removing a
key from `HEAD` does not remove it from the objects git still holds, so the
only remediation is rotation at the provider. Tracked in #16.

The admin allowlist used to ship in the bundle — not a credential, but a target
list for phishing aimed at the accounts that can modify the catalogue. It was
removed in #19; administrator identities are no longer discoverable from the
client.

## API hardening

`server.ts`:

- **Rate limiting** — `express-rate-limit` on all routes: 120/15 min general,
  40/15 min chat, 10/15 min cron, 600/15 min static and SPA fallback.
- **Input caps** — 4,000 characters per chat message, 20 history turns, 128 KB
  JSON body.
- **`CRON_SECRET` fails closed** — returns 503 when the variable is unset rather
  than allowing the request.
- **Helmet** — baseline headers plus a Content-Security-Policy enforced in every
  environment, relaxed in development only (`'unsafe-inline'` for Vite's inline
  preamble, `ws:` for HMR). A deny-all CSP (`default-src 'none'`) is scoped to
  `/api`.
- **`trust proxy` = 1** so the rate limiter keys on the real client address.
- **`x-powered-by` disabled** by Helmet.

`vercel.json` adds `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy` and `Strict-Transport-Security` to the
static site.

The rate limiter's blind spot: it only protects Express. Direct Firestore writes
from an anonymous client never reach it.

## OWASP Top 10 status

| Category | Status | Detail |
|---|---|---|
| A01 Broken Access Control | **Critical** | Role self-assignment; unauthenticated writes; unconstrained counters |
| A02 Cryptographic Failures | OK | TLS at Vercel, HSTS set, no custom crypto |
| A03 Injection | Medium | No SQL. Prompt injection possible on `/api/chat` — only length is filtered. No `dangerouslySetInnerHTML` anywhere |
| A04 Insecure Design | High | One endpoint with one auth mechanism serving both cron and admin; catalogue written from the client |
| A05 Security Misconfiguration | Medium | CSP in place. App Check absent. Maps key restrictions undocumented |
| A06 Vulnerable Components | OK | `npm audit --omit=dev`: 0 vulnerabilities |
| A07 Auth Failures | High | Authentication delegated correctly; authorization decided client-side |
| A08 Data Integrity | High | Gemini output persisted without schema validation |
| A09 Logging Failures | High | No structured logs, no alerts, no audit trail |
| A10 SSRF | N/A | The server does not fetch user-supplied URLs |

## XSS

No `dangerouslySetInnerHTML`, no `innerHTML`, no `eval` in the codebase. React's
default escaping applies throughout.

`src/lib/sanitize.ts` provides `getSafeImageUrl` (protocol allowlist) and
`sanitizePlainText` (HTML entity escaping). `getSafeImageUrl` is **not** applied
in three places that render remote URLs:

- `VoluntariadosExplorer.tsx:168` — `prog.imageUrl`
- `AdminDashboard.tsx:365` — `currentUser.avatar`
- `BecasExplorer.tsx:1339` — `beca.imageUrl` (from Firestore)

Its allowlist includes `data:`, which contradicts the function's own comment.
`data:` URIs do not execute in `<img src>`, so impact is low.

## CSRF

Not applicable. The API accepts no cookie-based credentials, so there is no
ambient authority for a cross-site request to abuse. CORS is not configured on
Express, which in practice means same-origin only.

## Sensitive information

`handleFirestoreError` logs the user's **email address and uid** on every
Firestore error. In the browser that is the user's own console; in any log
aggregation it becomes stored PII. Relevant under GDPR given the audience.

API error responses on `/api/chat` and the cron endpoint include
`details: error.message`, which can surface upstream provider messages to the
client.

## Dependency security

`npm audit --omit=dev` reports 0 vulnerabilities. GitHub code scanning (CodeQL)
is enabled and previously raised two alerts, both now resolved: missing rate
limiting and an insecure Helmet configuration.

## Not present

- Firebase App Check — no attestation that requests come from the real app.
- Audit log — no record of who changed the catalogue, moderated content or
  changed roles.
- Budget alerts or Firestore quotas — no ceiling on abuse cost.
- Server-side validation of persisted data.
