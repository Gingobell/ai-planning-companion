# Plan: Gemini adapter (#9) and capture from one sentence (#10)

Approved by Gin on 2026-11-23.

## Context

The chat is the core of the product (PRD US-01, US-06): a user says one sentence and the goals and tasks in it are saved before anything is asked. #9 puts Gemini behind a small provider-neutral interface (CLAUDE.md "The LLM sits behind an adapter", "The application validates, the assistant proposes"). #10 uses it to capture items from a message and save them first; it is one of the six TDD features. #11 (the first clarifying question) builds on this in its own plan.

Decision (Gin, 2026-11-23): use Gemini's free tier, where Google states content is used to improve its products. The app says so on the sign-up page and in the README, sends the model only the current message plus the user's time zone and the current time, and keeps the model name in an environment variable so a paid key can replace it later without code changes.

## Acceptance criteria

#9 (tests required, not a TDD feature):
- **A1** The app calls the model only through the `LanguageModel` interface.
- **A2** Model output is schema-checked before it reaches the domain; invalid output is an explicit `{ kind: "invalid-output" }` result, never saved.
- **A3** Tests use a test double for the model; no test calls Gemini.
- **A4** The key comes from `GEMINI_API_KEY`, is never logged, and a missing key fails with a clear message. Rate limits and network failures map to `{ kind: "unavailable" }`.

#10 (TDD, red and green per criterion):
- **C1** A goal or task mentioned in a message is saved before the assistant asks anything; the user's message is saved first even if the model then fails.
- **C2** Goals and tasks are told apart; a task can be linked to a goal from the same message or stay on its own.
- **C3** Each item gets a free-text category suggestion, saved as editable data.
- **C4** A long-term goal can be saved without a deadline, and a deadline is saved only when the user stated one (source `external`); the model never invents one.
- **C5** Retrying the same message creates no duplicate records. Text edited after a failure is sent as a new message, so the edited text is saved (fix found testing #65).

## Design

- **Interface** `src/llm/language-model.ts`: `generateJson({ system, prompt, jsonSchema })` returning `{ kind: "ok"; value: unknown } | { kind: "unavailable" } | { kind: "invalid-output" }`. Callers validate `value` with a zod schema; the schema and its JSON Schema come from one definition, so they cannot drift.
- **Gemini** `src/llm/gemini.ts`: `@google/genai` with JSON output (`responseMimeType: "application/json"` plus a JSON schema), model from `GEMINI_MODEL` (default `gemini-3.5-flash-lite`). Created lazily like `getAuth()`, so builds need no key. Errors are mapped to results, and logs carry only an error code, never the key or message text. SDK version: a release at least two weeks old, with its JSON-mode API checked in its type definitions before use.
- **Capture rules** (pure, `src/domain/capture/`): `planCapture(extraction, { messageId, now, timeZone, userId })` turns validated model output into `Goal` and `Task` records. Ids come from the message id and item position, so a retry produces the same ids. A deadline is kept only when the model marks it as stated by the user and gives a valid local date and time, which Temporal turns into a UTC instant; anything else is dropped rather than guessed.
- **Capture service** `src/server/chat/capture-message.ts`: `captureMessage({ repos, model, messageId, text, now, timeZone })` saves the user message, calls the model, runs `planCapture`, saves goals before tasks, and saves a short assistant reply listing what was saved. A record that already exists for the same id (a retry) counts as saved, not as a duplicate. If the model fails, the user message stays saved and the result says so, so the UI can offer a retry. All data access goes through the scoped repositories from `getCurrentUser()` (CLAUDE.md security rule).
- **Chat page** `src/app/(app)/page.tsx`: today's messages (`listByChatDate` in the user's time zone) and a composer (DESIGN.md: composer at `--h-lg`, inset shadow, chat column max 720 px; replies as paragraphs with "Saved" inline). A server action calls `captureMessage` with a client-generated message id, so a resend of the same submission is idempotent. The input stays in the box while the request runs and comes back on failure (PRD Section 7). Checked in the browser at desktop and 400 px with Chinese text.
- **Disclosure:** one line under the sign-up form ("The assistant uses Google's Gemini free tier; Google may use what you type in chat to improve its products."), the README, and the CLAUDE.md tech stack row.
- **Dependencies:** `@google/genai` (LLM layer is decided in CLAUDE.md) and `zod` (already installed through `@neon/auth`, added as a direct dependency for schema checks), both recorded in the tech stack table.

## Steps

PR 1, #9 (branch `feat/gemini-adapter`):
1. `docs/plans/gemini-and-capture.md` (this plan).
2. Install the SDK and `zod`; interface, Gemini implementation and tests with a fake client (key handling, error mapping, invalid JSON, schema check).
3. Rule files: CLAUDE.md tech stack (LLM row: free tier, `GEMINI_API_KEY`, `GEMINI_MODEL`, zod), `.env.example`, README disclosure.

PR 2, #10 (branch `feat/capture`, after PR 1):
4. Red and green per criterion C1 to C5 on `planCapture` and `captureMessage`, with a fake model and PGlite repositories; evidence in `docs/evidence/09-capture/log.txt`.
5. Chat page, server action and the sign-up disclosure line; DESIGN.md only if a new pattern is needed.

## What Gin does

Only before testing on a preview: create a key at https://aistudio.google.com/apikey in a Google Cloud project without billing (free tier), and add `GEMINI_API_KEY` to Vercel for Production and Preview, marked Sensitive. Nothing is needed to write or test the code.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, `npm run build` pass; no test reaches the network.
- On the #10 preview with the real key: send "Lab 5 for CS6983 is due Thursday at 11:59 pm" and "I want to land a summer internship"; Goals & tasks data shows one task with an external deadline and one long-term goal without a deadline; resending the same message adds nothing.
