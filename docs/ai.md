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

## One assistant, two presentations

| Surface | Component | Backend |
|---|---|---|
| Chat IA tab | `ChatIA.tsx` | `POST /api/chat` → Gemini |
| Floating bubble | `FloatingChatWidget.tsx` | `POST /api/chat` → Gemini |

Both call `useMigrationChat` in `src/lib/useMigrationChat.ts`, which is the only
place the request is made. The bubble is the shell; `ChatIA` is the full view.

Until #4 they were different assistants. `FloatingChatWidget.handleSendMessage`
matched five keyword branches — scams, empadronamiento, budget, student work,
and a generic fallback — and returned a fixed string with no network call at
all. The bubble renders on every screen, so the more prominent entry point was
the one that could not answer, and the same question gave different answers
depending on where it was asked. The fixed replies also embedded their own
figures (350–650 € rent, a 2,500–4,000 € buffer), a third copy of numbers that
exist in the prompt and in the datasets.

Three things follow from having one implementation:

- **Maximising carries the conversation.** The bubble hands its messages to
  `ChatIA` through `initialHistory`; it used to pass only the draft, so seeing
  the exchange in a bigger window meant losing it.
- **A failure is visible.** A non-2xx response or a body with no reply throws,
  and both surfaces render the same "no pudimos conectar" message. Reading
  `data.reply` from a 429 body used to produce "No se pudo obtener la
  respuesta." rendered as though the assistant had said it.
- **Sources come from the answer or not at all.** They used to fall back to two
  fixed portals, so every reply was credited to sources it had never cited.

## Retrieval

There is none. The model answers from its training data. The application's own
verified content — 24 visa records, 22 scholarships, anti-scam guidance, consular
addresses — is never passed as context.

`ChatIA` renders a `sources` array on assistant messages, but the backend never
populates it, so no citation appears. It used to appear to work because every
reply was given two hardcoded sources and the screen opened on a seeded example
conversation; both are gone (#4).

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
