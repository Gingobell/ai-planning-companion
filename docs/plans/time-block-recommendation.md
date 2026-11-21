# Plan: Time block recommendation (HW4 feature A)

## Context

AI Planning Companion's key first-use moment is quick capture: the user says "lab 5 is due Thursday" and the assistant immediately proposes one concrete time block to accept in a single step (PRD US-06, line 103). This needs a reliable scheduling rule underneath it: respect availability and fixed commitments, never double-book, never schedule without a deadline, say clearly when nothing fits, and work in the user's timezone (PRD lines 48, 56-58, 94-95, 149, 160).

HW4 builds this rule as a pure TypeScript domain function with strict TDD. Exploration found no domain code and no tests yet; Node 25.6.1 and TypeScript 5.9.3 have no native `Temporal`, and no timezone library is installed. Decision (approved by Gin): use `temporal-polyfill`.

Out of scope for HW4: LLM parsing, database, auth, UI, API routes, multi-block splitting of long tasks, priorities between several tasks.

## Acceptance criteria (final wording)

- **AC1 Earliest feasible block.** Given a deadline and an estimated duration, return the earliest block of exactly that duration that lies inside the user's availability, starts no earlier than `now` rounded up to the next 15-minute boundary, and ends no later than the deadline.
- **AC2 No double-booking.** The block never overlaps a fixed commitment or an existing time block. Touching edges (one ends at 10:00, the next starts at 10:00) are allowed.
- **AC3 Needs deadline.** A task without a deadline returns `needs-deadline` and no block.
- **AC4 Infeasible.** If no block fits before the deadline, return `infeasible` with reason `no-free-slot`; if the deadline is already past, reason `deadline-passed`. The input, including the deadline, is never modified.
- **AC5 Preference.** With a confirmed preferred time-of-day window, return the earliest block inside it when one exists before the deadline (`preference: "met"`). Otherwise fall back to the earliest block anywhere in availability with `preference: "unavailable"`. A preference never overrides commitments or the deadline.
- **AC6 Timezone and DST.** Availability and preferences are local wall-clock times in the user's IANA timezone. Blocks are computed correctly on DST transition days, and the block length is real elapsed minutes.

## Interface

File `src/domain/scheduling/recommend-time-block.ts` (named export, no framework imports):

```ts
export interface TimeInterval { start: string; end: string }   // ISO 8601 instants, UTC "Z"
export interface LocalWindow { start: string; end: string }    // "HH:MM" wall-clock
export type WeeklyAvailability = Partial<Record<1 | 2 | 3 | 4 | 5 | 6 | 7, LocalWindow[]>>; // ISO weekday, 1 = Monday

export interface RecommendTimeBlockInput {
  now: string;
  timeZone: string;
  task: { estimatedMinutes: number; deadline?: string };
  availability: WeeklyAvailability;
  fixedCommitments: TimeInterval[];
  existingBlocks: TimeInterval[];
  preferredWindow?: LocalWindow;
}

export type TimeBlockRecommendation =
  | { kind: "scheduled"; block: TimeInterval; preference: "met" | "unavailable" | "none" }
  | { kind: "needs-deadline" }
  | { kind: "infeasible"; reason: "deadline-passed" | "no-free-slot" };

export function recommendTimeBlock(input: RecommendTimeBlockInput): TimeBlockRecommendation;
```

Approach: walk local dates from today to the deadline date; for each date, turn availability windows into instants with `Temporal.PlainDateTime.toZonedDateTime(timeZone)`; clip to `[rounded now, deadline]`; subtract busy intervals; take the first gap of at least `estimatedMinutes`. For AC5, run the same search first on windows intersected with the preferred window, then without it. Expected outcomes are results, not exceptions (CLAUDE.md architecture decisions).

## TDD cycles (one red, green, refactor per AC)

Tests live in `src/domain/scheduling/recommend-time-block.test.ts`. A small test helper builds instants from local times so expectations stay readable.

| Cycle | Red tests | Notes |
| --- | --- | --- |
| 1 AC3 | no deadline returns `needs-deadline` | Red stub exports the function and throws `not implemented`, no logic |
| 2 AC1 | free day returns block at rounded `now`; `now` before availability starts at window start; block length equals estimate | |
| 3 AC2 | skips a fixed commitment; skips an existing block; adjacent edges allowed; moves to the next day when today is full | |
| 4 AC4 | no gap before deadline gives `no-free-slot`; past deadline gives `deadline-passed`; input deep-equals a copy after the call | |
| 5 AC5 | preferred evening slot chosen over earlier morning slot; preference full falls back with `unavailable`; preference never beats a commitment | |
| 6 AC6 | America/Los_Angeles 2027-03-14 (spring forward) and 2026-11-01 (fall back) map 09:00 local to the right instants; a 2-hour block across the skipped hour lasts 120 real minutes | |

Each phase: run `npm test` (and `npm run typecheck`, `npm run lint` for green and refactor), append the command and key output to `docs/evidence/03-tdd/log.txt`, show Gin the file list and message, then commit:
`test: <behavior> (red)`, `feat: <behavior> (green)`, `refactor: <what changed>`. If a refactor has nothing worth changing, skip the commit and note it in the log. A red step only counts if the failure is the missing behavior, not a compile or import error.

## Setup commits before cycle 1

1. `chore: add temporal-polyfill` (npm install, `npm audit` must stay at 0).
2. `docs: record timezone library decision in CLAUDE.md` (architecture decisions: why `temporal-polyfill`).
3. `docs: add plan for time block recommendation` (this plan saved to `docs/plans/time-block-recommendation.md` as Plan mode evidence).

## Critical files

- `src/domain/scheduling/recommend-time-block.ts` (new)
- `src/domain/scheduling/recommend-time-block.test.ts` (new)
- `CLAUDE.md`, `package.json`, `package-lock.json`
- `docs/plans/time-block-recommendation.md`, `docs/evidence/03-tdd/log.txt` (new)
- Existing config reused: `vitest.config.ts` (`@` alias, `src/**/*.test.ts`), `docs/engineering/tdd-workflow.md`.

## Verification

- After every phase: `npm test` shows the expected red or green result; `npm run typecheck` and `npm run lint` exit 0 on green and refactor.
- At the end: all six ACs have red, green and refactor (or noted skip) commits in `git log --oneline`; `npm audit` reports 0 vulnerabilities; evidence log lines map to commit SHAs.
- Push to `origin/main` only after Gin reviews each batch.
