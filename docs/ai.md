# AI integration

How the product uses generative AI today.

## Provider

Google Gemini via `@google/genai` (v2.x), model `gemini-3.6-flash`. The client is
initialised lazily in `server.ts` and reads `GEMINI_API_KEY` from the
environment. The key is server-side only and never reaches the browser.

If the key is unset the client is constructed with `"dummy-key-for-boot"` so the
process still starts; requests then fail at call time.

## Endpoints

### `POST /api/chat`

Accepts `{ message, history }`.

- Rate limited to 40 requests per 15 minutes per client.
- `message` must be a non-empty string of at most 4,000 characters, otherwise
  400 or 413.
- `history` is truncated to the last 20 turns; each entry is capped at 4,000
  characters and non-string content is skipped.
- Roles are mapped: `user` → `user`, `model`/`assistant` → `model`.
- Sends a large Spanish `systemInstruction` with `temperature: 0.7`.
- Returns `{ text }`, or 500 with `{ error, details }`.

### `POST /api/cron/sync-scholarships`

Accepts `{ academicYear, secretKey }`.

- Rate limited to 10 requests per 15 minutes.
- Requires `CRON_SECRET`; returns 503 when the variable is unset and 401 when the
  provided key does not match.
- Prompts Gemini for at least 15 scholarship records in a fixed JSON shape, with
  `responseMimeType: "application/json"` and `temperature: 0.2`.
- Strips markdown fences from the response, parses it, and accepts either an
  array or an object with `scholarships`/`items`.
- Returns the parsed records in the response body.

**It does not write to Firestore.** `server.ts` does not import Firebase. See
[data.md](./data.md).

## The system instruction

`server.ts` holds a Spanish prompt defining the assistant as a migration adviser.
It specifies four behaviours: answer in the user's language; produce a structured
migration diagnosis when the user shares career, age, family situation, budget or
languages; always cite official portals; keep a warm but rigorous tone.

The prompt contains **hardcoded factual figures** — IPREM amounts, Sperrkonto,
Express Entry age points, Stamp 2 conditions. These duplicate values that also
exist in `src/data/migrationGuides.ts` and can drift from it. Updating them
requires editing the prompt and redeploying.

## Two chat surfaces that behave differently

| Surface | Component | Backend |
|---|---|---|
| Chat IA tab | `ChatIA.tsx` (857 lines) | `POST /api/chat` → Gemini |
| Floating bubble | `FloatingChatWidget.tsx` (273 lines) | Hardcoded `if/else` over keywords |

`FloatingChatWidget.handleSendMessage` matches five keyword branches — scams,
empadronamiento, budget, student work, and a generic fallback — and returns a
fixed string. It makes no network call. The bubble is rendered on every screen,
so it is the more prominent entry point.

The consequence: the same question produces different answers depending on where
it is asked. The fixed replies also embed their own figures (350–650 € rent,
2,500–4,000 € starting buffer), a third copy of numbers that exist in the prompt
and in the datasets.

## Retrieval

There is none. The model answers from its training data. The application's own
verified content — 24 visa records, 22 scholarships, anti-scam guidance, consular
addresses — is never passed as context.

`ChatIA` already renders a `sources` array on assistant messages, but the backend
never populates it, so citations only appear on the seeded example conversation.

## Entry points into the chat

Four screens navigate to the chat tab with a pre-filled prompt:

- Scholarship detail — asks how to stand out in that specific application.
- Country guide — asks about a named visa or the best visa for that country.
- Planner step — asks for deadlines, costs and pitfalls for that step.
- Budget — asks about the calculated budget.

Prompts are built by string interpolation in `App.tsx` and the source components.

## Input handling and abuse surface

Length is capped and history is bounded, which limits cost. There is **no
semantic filtering**: user text reaches the model directly, so prompt injection
is possible. The practical risk is a manipulated answer rather than data
exposure, since the model has no tools and no data access — but in a product
where users act on migration advice, a manipulated answer has real consequences.

There is no logging of prompts or responses, so a bad answer cannot be
reproduced or investigated after the fact.

## Client-side error handling

`ChatIA` catches request failures and appends an assistant message telling the
user to check their connection and retry. The failure is not reported anywhere
else.
