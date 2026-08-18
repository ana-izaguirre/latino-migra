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

Two independent checks that do **not** agree:

| Layer | Check | Trusts |
|---|---|---|
| Client (`authUtils.ts`) | `user.role === "admin"` **or** email in allowlist | A field the user can write |
| Firestore rules | `request.auth.token.email_verified` + token email in allowlist | The identity provider |

The server-side rule is sound. The client-side check is not.

### Privilege escalation (present)

`src/components/AuthModal.tsx` renders two buttons to any signed-in user:

```tsx
onClick={() => { onSignIn({ ...currentUser, role: "admin" }); }}
```

Because `isAdmin()` short-circuits on `user.role === "admin"`, this unlocks the
admin tab and admin-only UI. Because `firestore.rules` allows
`users/{uid}` to be written by its owner, and `App.tsx` reads
`role: profile?.role` back from that document, the elevation survives sign-out.

What it grants: the admin dashboard and its controls. What it does **not** grant:
scholarship writes, which the email-based rule still blocks. The data layer
holds; the application authorization layer does not.

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
| Real API keys in the working tree | None found |
| Real API keys in git history | One leaked Google API key — see #16 |
| Firebase config in bundle | Yes — public by design for web SDKs |
| Fallback project ID in source | `refined-coral-0zp2g` hardcoded in `src/lib/firebase.ts` as a default |
| Admin emails in bundle | Yes — four addresses in `src/lib/authUtils.ts` |
| `GEMINI_API_KEY` | Server-side only, never sent to the client |
| `CRON_SECRET` | Server-side; fails closed when unset |
| Google Maps key | Client-side; referrer restrictions not documented |

The hardcoded fallback project ID is not a secret, but it does mean a developer
without `.env` silently connects to a real Firebase project.

This audit read the working tree, not the history. GitHub Secret Scanning
later flagged a Google API key committed in an earlier revision: removing a
key from `HEAD` does not remove it from the objects git still holds, so the
only remediation is rotation at the provider. Tracked in #16.

The admin allowlist in the bundle is not a credential, but it is a target list
for phishing aimed at the accounts that can modify the catalogue.

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
