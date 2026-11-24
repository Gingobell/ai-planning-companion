# Plan: Reminder and check-in rules (#31, US-04)

## Context

PRD US-04 and Section 6 ("Reminders and check-ins") decide which reminders should exist and when: daily check-ins at agreed times, reminders only for tasks the user chose, quiet hours and pausing, removal when a task is completed or canceled, updates when a block moves, no duplicates on retry, and no follow-up after an unanswered check-in. This plan covers the rules as pure functions in `src/domain/reminders/`. Running them on a schedule and sending notifications is #23 (Sprint 2), which calls `planReminders` and saves its result.

Out of scope: scheduled jobs, notification delivery, the `/preferences` page.

## Acceptance criteria

- **AC1 Daily check-ins.** For each day in the planning horizon, each of `user.checkInTimes` ("HH:MM" in `user.timeZone`) gives one check-in at the matching instant. Times already past `now` are skipped. On DST days a local time maps to the right instant, and a time that does not exist (spring forward) moves to the next valid time.
- **AC2 Chosen tasks only.** A task reminder exists only for an accepted time block of a task with `remindersEnabled` that is not completed or canceled. It is scheduled at the block start. Tasks without reminders enabled get none.
- **AC3 Quiet hours and pause.** No reminder or check-in is scheduled inside `user.quietHours` (a window may cross midnight) or while `user.remindersPause` is active (until `until`, or with no end).
- **AC4 Completed, canceled and moved.** Pending reminders of a completed or canceled task, or of a block that no longer exists, are canceled. When a block moves, its old pending reminder is canceled and one at the new start is created.
- **AC5 No duplicates.** Every reminder has a `deliveryKey` built from what it is for and when (`check-in:<local date>T<time>`, `block:<block id>:<start>`). A wanted reminder whose key already exists (pending or delivered) is not created again, so running the rules twice gives the same result.
- **AC6 Unanswered check-ins.** A delivered check-in without `answeredAt` has outcome `unknown`, never "missed", and creates no extra reminder or follow-up.
- **AC7 Purity.** Inputs are not mutated; the same inputs always give the same output.

## Interface

```ts
// src/domain/reminders/plan-reminders.ts
export type ReminderDraft = Omit<Reminder, "id" | "version" | "userId" | "status">;

export interface PlanRemindersInput {
  now: string;
  horizonDays: number; // local days, starting today
  user: User;
  tasks: Task[];
  timeBlocks: TimeBlock[];
  existing: Reminder[];
}

export interface ReminderPlan {
  create: ReminderDraft[];
  cancel: Id[]; // ids of pending reminders to cancel
}

export function planReminders(input: PlanRemindersInput): ReminderPlan;

// src/domain/reminders/check-in-outcome.ts
export function checkInOutcome(reminder: Reminder): "answered" | "unknown" | "not-delivered";
```

`planReminders` returns a difference against `existing`, so the caller can save it all or nothing. Local times are turned into instants with `Temporal` from `temporal-polyfill`, as in the scheduling rules.

## TDD cycles

| Cycle | Red tests |
| --- | --- |
| 1 AC1 | two check-in times over two days give four check-ins; past time today skipped; America/Los_Angeles spring-forward and fall-back days |
| 2 AC2 | reminder at block start for a chosen task; none when `remindersEnabled` is false; none for a proposed block or a completed task |
| 3 AC3 | check-in inside quiet hours dropped; quiet hours across midnight; pause with `until` drops only until then; pause without end drops all |
| 4 AC4 | completing a task cancels its pending reminder; moved block cancels old and creates new; delivered reminders are never canceled |
| 5 AC5 | existing pending or delivered key not recreated; running the plan on its own output gives an empty plan |
| 6 AC6 | delivered unanswered check-in gives `unknown` and no new reminders |
| 7 AC7 | inputs deep-equal their copies after the call |

Evidence for every red and green step goes to `docs/evidence/07-reminders/log.txt` with the commit SHA.

## Decisions

1. A check-in time that falls inside quiet hours is dropped, not moved to the end of quiet hours.
2. A task reminder fires at the block start, with no lead time.

## Verification

`npm test`, `npm run typecheck`, `npm run lint` and `npm run format:check` pass after every green and refactor step.
