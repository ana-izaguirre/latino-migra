# Data

Firestore collections, access rules, static datasets and write paths, as they
exist today. There is no ORM, no migrations and no schema enforcement.

## Storage model

Two sources of truth coexist:

1. **Static TypeScript datasets** in `src/data/`, bundled into the client.
2. **Firestore**, read directly by the browser via the Firebase client SDK.

Every Firestore-backed screen falls back to the static dataset when the query
fails or returns empty. This keeps the app usable without a database, and also
means database failures are invisible to the user.

## Static datasets

| File | Records | Size | Changes with |
|---|---|---|---|
| `migrationGuides.ts` | 7 countries / 24 visas | 48 KB | Immigration law |
| `scholarships.ts` | 22 | 35 KB | Annual calls and deadlines |
| `locations.ts` | 32 | 20 KB | Consular addresses, phones, hours |
| `antiScamData.ts` | per-country guidance | 15 KB | Rarely |
| `volunteeringData.ts` | 6 | 11 KB | Programme availability |
| `countriesData.ts` | 29 | 7 KB | Effectively static (reference data) |
| `studyProgrammes.ts` | 13 | 15 KB | Official programme portals |

All seven are eagerly imported and ship in the initial bundle.

`studyProgrammes.ts` is the only dataset with an enforced shape. Every entry
must carry an `officialUrl` served over https from a domain on
`OFFICIAL_STUDY_DOMAINS` in `src/lib/studyProgrammes.ts`; one that does not is
reported on screen rather than rendered or dropped. It has no Firestore
counterpart — adding one means a new rule, which `docs/security.md` puts behind
human approval. Spec: `specs/estudios-catalogue.md`.

## Firestore collections

Nothing enforces a document shape. Documents are whatever the client writes;
the table below is the only record of the intended shape.

| Collection | Read | Write | Written by |
|---|---|---|---|
| `scholarships` | public | admin only (entry in `admins`) | Browser, admin UI |
| `admins/{uid}` | own entry only | **no rule — every client write denied** | Firebase console only |
| `users/{uid}` | owner | owner, six named fields only | Browser, on sign-in |
| `savedScholarships` | owner | owner | Browser |
| `userNotes` | owner | owner | Browser |
| `migrationPlans/{uid}` | owner | owner | Browser |
| `userPreferences` | owner | owner | Browser — alert settings, plus a `display` key for theme, language, currency and both countries |
| `forumPosts` | public | **`create` unauthenticated** | Browser |
| `forumPosts/{id}/replies` | public | **`create` unauthenticated** | Browser |
| `feedbackSuggestions` | public | **`create` unauthenticated** | Browser |
| `visa_guide_votes/{voteId}` | Public | Signed-in, own id only, create only | Browser |

### Rule structure

`firestore.rules` opens with a deny-all catch-all:

```
match /{document=**} { allow read, write: if false; }
```

Owner-scoped collections then check
`isSignedIn() && resource.data.userId == request.auth.uid` on read/update/delete
and `request.resource.data.userId == request.auth.uid` on create. That pattern is
correct and consistently applied.

`isAdmin()` checks whether `admins/{request.auth.uid}` exists. Because that
collection declares no write rule, the catch-all denies every client write and
an administrator can only be added from the Firebase console.

This replaced a four-address email allowlist that was duplicated in
`src/lib/authUtils.ts` and shipped in the client bundle (#19).

`users/{uid}` splits `create` and `update` so each can name the fields it
accepts — `uid`, `displayName`, `email`, `photoURL`, `countryOfOrigin`,
`updatedAt`. `allow write` previously accepted any field, including `role`,
which `App.tsx` read back as an authorization decision.

### `visa_guide_votes` — one document per (user, country, visa)

The path used to be `visa_guide_votes/{countryCode}/visas`, which appeared in no
`match` block, so the deny-all catch-all applied. Both functions caught the
permission error and fell back to a module-level `Map`, so the failure was
invisible — and the guide printed `helpfulVotes || 18`, an invented count, for
every visa in the product (#24, #79).

It is a flat collection now. The document id is
`{uid}__{countryCode}__{visaId}`, and the rule requires the id to match the
fields in the document, so the id itself enforces one vote per person: a second
vote writes the same document and `create` fails once it exists. There is no
`update` and no `delete`, and no stored counter — a counter any signed-in
client may increment is a counter anyone can inflate, and there is no server
here to hold it.

The count is an aggregation over those documents (`getCountFromServer`), which
is why `read` is public: a guest sees the counts and cannot vote.

A failed read leaves the counts unknown, and unknown renders as no number.

## Write paths

### Owner-scoped writes
Straightforward: the browser writes documents keyed to the signed-in user, and
the rules confirm ownership.

### Scholarship catalogue
```
GitHub Actions (weekly)
      │  POST /api/cron/sync-scholarships
      ▼
Express ──► Gemini ──► returns JSON in the response body
      │
      └──►  (nothing persists it)

Admin browser ──► triggerScholarshipSync() ──► same endpoint
      └──► seedScholarshipsToDB(result.data) ──► Firestore
```

`server.ts` does not import Firebase. The only code that writes the catalogue is
`seedScholarshipsToDB()` in the browser, called from `AdminDashboard` and
`BecasExplorer`. The scheduled workflow therefore consumes Gemini quota and
discards the result.

`seedScholarshipsToDB` loops with sequential `await setDoc(..., { merge: true })`.
There is no batching, so a failure part-way leaves the catalogue holding two
academic years at once. `merge: true` means it never deletes, but it does
overwrite the whole catalogue from a single UI button with no confirmation.

### Bookmarks
`toggleBookmarkScholarship` queries by `userId` + `scholarshipId`, checks whether
the result is empty, then either deletes `snapshot.docs[0]` or calls `addDoc`
with a random ID. There is no transaction. Two concurrent calls — a double tap
on mobile — both see an empty result and create two documents; deletion only
removes the first, leaving orphans.

The codebase contains **zero `runTransaction` and zero `writeBatch`**.

## Queries

- 8 `getDocs` calls; 5 have no `limit()`.
- The high-traffic ones are bounded: `fetchScholarshipsFromDB` at 100,
  `fetchCommunityPostsPaginated` by `fetchLimit`.
- Only `fetchCommunityPostsPaginated` combines `orderBy` with pagination, and
  it is the one composite query in the codebase: `where("category", "==", …)`
  plus `orderBy("createdAt", "desc")`.
- **Requires the composite index `(category ASC, createdAt DESC)` on
  `forumPosts`.** Firestore rejects the query without it, so selecting any
  category other than "Todas" fails until the index exists on the target
  database — which is the named `ai-studio-latinomigra-…` one, not `(default)`.
- No `firestore.indexes.json` exists, so indexes are created by hand in the
  console and nothing in the repository records which ones production needs.
  That is the gap this query just walked into.

## Connections and pooling

Handled by the Firebase client SDK. Nothing to configure or tune. Initialisation
is wrapped in try/catch and falls back to a "safe mode" where `db` is null and
every helper returns a static fallback.

## Error handling

`handleFirestoreError(error, operationType, path)` logs a JSON object and
re-throws. The logged object includes `authInfo.userId` **and
`authInfo.email`**, so user email addresses appear in error logs.

## Data risks in the current design

| Risk | Mechanism |
|---|---|
| Data loss | No Point-in-Time Recovery, scheduled exports or documented restore procedure. |
| Corruption | Non-atomic catalogue seeding; Gemini output written without schema validation. |
| Duplication | Bookmark toggle without transaction or deterministic ID. |
| Race conditions | No transactions or batches anywhere in the data layer. |
| Unauthorized access | Unauthenticated `create` on three collections. The self-writable `role` field was closed in #19. |
| Unbounded growth | Anonymous document creation is reachable through the public Firebase config, bypassing the Express rate limiter entirely. |
| Counter manipulation | `hasOnly(['likes'])` constrains which keys change, not their values, and does not require authentication. |
