# Plan: Ask the most important missing question first (#11)

Approved by Gin on 2026-11-24.
## Context

#10 (merged, c97392f) saves the goals and tasks in one chat message and replies with what it saved. A task without a deadline cannot be scheduled (PRD Section 6, "Deadlines"), so the next step of the core flow (PRD US-01, US-06) is to ask for it right after capture, and, when there is no external deadline, to agree on a target date with the user. #11 is one of the six TDD features (p3-work-split.md), so every acceptance criterion gets a red and a green commit.

Scope: deadline questions only. Effort estimates are #18 and bringing old open questions back on return or at check-in is #22; both build on what this adds.

## Acceptance criteria (from issue #11, as testable statements)

- **Q1** After capture, each new task without a deadline gets a deadline question. Goals, tasks with a stated deadline, and completed or canceled tasks get none. The deadline is the first and, in #11, the only topic asked (#18 adds effort after it).
- **Q2** When the user says there is no external deadline or they are unsure, the assistant suggests a target date and stores it on the open question as a proposal; the task's deadline does not change. Only when the user agrees is it saved as the task's deadline with source `agreed`. A suggestion in the past, an impossible date, or an agreement when no proposal exists changes nothing. If the user agrees after the proposed date has passed, nothing is saved; the proposal is dropped and the question is asked again (review of #65).
- **Q3** At most two questions per reply. No question for anything the user already said (a stated deadline, a task that already has an open deadline question), and a question is never duplicated.
- **Q4** Every question asked is saved as an open question linked to its task, before the reply. It stays open until answered; a retry of the same message creates no second question.

- **Q5** (added 2026-11-24 after review against DESIGN.md section 10) The latest reply shows answers with each question it asked: a deadline question lists "No fixed date, suggest a target" and "Type my own answer"; a suggested target date is a card with Accept and Another time. Accept saves the target as the agreed deadline without asking the model to read anything; Another time clears the proposal and asks for the user's own date. A button on a question that is no longer open changes nothing. Typing an answer still works.

A user answer like "it's due Friday" sets the deadline (source `external`; "let's aim for Friday" is `agreed`) and marks the question answered.

## Design

**Record change** (`src/domain/records.ts`): `OpenQuestion` gains `topic: "deadline"` (later issues widen the union) and `proposedDeadline?: string` (UTC instant of a suggested target date awaiting agreement). Postgres: two columns in `schema.ts`, migration `drizzle/0002_*` via `npm run db:generate`, mapper update, contract samples updated (the minimal sample becomes a deadline question). Sihui's in-memory store (#63) stores whole records, so it needs no change; the PR tells her.

**Pure rules** in `src/domain/clarification/deadline-questions.ts` (Temporal only, now and time zone passed in):
- `applyDeadlineAnswers(answers, { questions, tasks, now, timeZone })` returns the task updates and question updates for: a stated date (external or agreed), "no deadline / unsure" with a suggested target (stored as proposal if valid and after now), "agrees" (proposal becomes an `agreed` deadline), "declines" (proposal cleared). Reuses the stated-deadline conversion from `src/domain/capture/plan-capture.ts` (extract `localDeadlineToInstant` there and share it, not copy it).
- `chooseDeadlineQuestions({ newTasks, touchedQuestions, openQuestions })` returns up to two questions: questions still open after this answer (a new proposal to confirm) first, then new tasks without a deadline in message order. Old untouched open questions are not re-asked here (#22 owns that, so the user is not nagged on every message). Question ids are `${taskId}:deadline`, so a retry or a second capture of the same task cannot create a duplicate.

**Model calls** (`src/server/chat/`):
- Extraction (`capture-schema.ts`): the prompt also lists the user's open deadline questions (index, task title, proposed date as local text, nothing else), and the schema gains `answers: [{ questionIndex, reply: "gave-date" | "no-deadline" | "agrees" | "declines", date?, dateKind?: "external" | "target", suggestedTarget? }]`. zod checks it as today; out-of-range indexes are ignored by the domain.
- Reply phrasing (new `reply-schema.ts`): a second, small call gets only structured facts (saved items with local deadline text, the chosen questions with task title and proposed date) and returns `{ reply, questions: string[] }` in the user's language, so Chinese messages get Chinese replies. zod checks length and that there is one text per question. If the call fails, today's template reply plus a template question ("When is "X" due? If there is no fixed date, I can suggest a target.") is used, so a save is never reported as failed because of wording.

**Flow** in `captureMessage` (`capture-message.ts`): save user message, extraction, save goals and tasks (as now), load open questions and apply answers (save task and question updates, checking every `SaveResult` with `isKept`), choose questions, phrase the reply, save the new open questions, then save the reply last (its presence still marks a finished capture). Updates are computed from the stored records, so a retry after a partial failure is a no-op for what already happened.

**Buttons (Q5)**: `OpenQuestion` also gains `askedIn` (the id of the reply that last asked it), so the thread shows answers only under the reply that asked. `captureMessage` takes an optional `choice: { questionId, reply: "agrees" | "declines" }`; with it, no extraction call is made and the answer goes straight to `applyDeadlineAnswers`, and a closed question returns `question-closed`. A server action `answerQuestion` sends the button's label as the user's message with that choice. "No fixed date, suggest a target" is sent as ordinary text, because the model picks the date. "Type my own answer" focuses the composer. Number keys pick an answer when the composer is not focused.

**UI**: answer list and decision card under the latest reply (DESIGN.md sections 6, 7 and 10), checked at desktop and 400 px with Chinese text.

## Steps (branch `feat/clarify`)

1. `docs/plans/clarifying-questions.md` with the criteria above (the protocol's "before coding" step).
2. Record and schema change with migration and contract samples (setup commit, tests updated, not a TDD cycle).
3. TDD cycles, red then green, evidence in `docs/evidence/10-clarification/log.txt` via `scripts/tdd-log.sh`:
   - Q1 `chooseDeadlineQuestions` picks new tasks without a deadline, never goals or tasks with one.
   - Q3 limit of two, open proposals first, no duplicate or repeated question.
   - Q2 `applyDeadlineAnswers`: proposal stored, agreement saves `agreed`, invalid or past suggestions and agreement without proposal change nothing, stated date answers the question.
   - Q4 `captureMessage` with the fake model and PGlite repositories: questions saved before the reply, retry adds none, an unanswered question stays open, answer in a later message updates the task.
   - Reply phrasing fallback (logic test, same file).
4. Rule files: CLAUDE.md layout (`src/domain/clarification/`) and current phase, README feature line, p3-requirements status if a row changes.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, `npm run build`; `npm run db:migrate` runs on the preview deploy.
- On the preview, signed in: "Finish the CS6983 blog post" gets one deadline question; "no fixed date" gets a suggested target; "yes" saves it (reply confirms the agreed date); a Chinese message gets a Chinese question; three tasks in one message get two questions; the same message resent after a failure adds no second question.
