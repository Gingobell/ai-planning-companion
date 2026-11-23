# Plan: Progress and task state rules (#30, US-03)

## Context

Users report progress in chat or on the pages, correct wrong states, and finish scheduled sessions. PRD Section 6 ("Tasks and progress") sets the rules: five task states, partial work stays in progress unless the user reports a blocker, finishing a time block does not complete its task, and a goal is complete only when the user confirms its outcome. These rules are pure functions in `src/domain/progress/` over the shared types in `src/domain/records.ts`. Callers (chat, `/today`, `/goals`) save the results through the repositories; the functions never save, never read the clock and never change `version`.

Out of scope: saving, chat wording, the `/goals` page, step proposals by the assistant.

## Acceptance criteria

- **AC1 Progress report changes the state.** `partial` moves a not-started, in-progress or blocked task to in-progress. `blocker` moves it to blocked. `completed` moves it to completed. A report on a completed or canceled task is rejected with `task-closed`; reopening goes through a correction (AC2).
- **AC2 Correction.** The user can set any task to any of the five states, including reopening a completed or canceled task. Setting the state it already has returns `unchanged`.
- **AC3 Finished time block.** Finishing a time block never changes the task's state. The result says the task's progress is unknown, so the caller can ask the user instead of assuming.
- **AC4 Goal progress.** Goal progress counts completed steps out of steps that are not canceled, lists the completed steps, and never marks the goal completed, even when every step is done. It reports `all-steps-done` so the caller can ask the user.
- **AC5 Goal completion.** A goal becomes completed only through an explicit user confirmation. A goal that is already completed or canceled returns `unchanged`.
- **AC6 Purity.** No function mutates its input; the input deep-equals a copy after every call.

## Interface

```ts
// src/domain/progress/task-progress.ts
export type ProgressResult =
  | { kind: "updated"; task: Task }
  | { kind: "unchanged"; task: Task }
  | { kind: "rejected"; reason: "task-closed" };

export function applyProgressReport(task: Task, report: Pick<ProgressReport, "kind">): ProgressResult;
export function correctTaskStatus(task: Task, status: TaskStatus): ProgressResult;
export function finishTimeBlock(task: Task, block: TimeBlock): { kind: "progress-unknown"; task: Task };

// src/domain/progress/goal-progress.ts
export interface GoalProgress {
  completed: number;
  total: number; // steps that are not canceled
  completedTaskIds: Id[];
  allStepsDone: boolean;
}
export function goalProgress(goal: Goal, tasks: Task[]): GoalProgress;
export function confirmGoalCompleted(goal: Goal): { kind: "updated" | "unchanged"; goal: Goal };
```

A `correction` report is stored as history; the state change itself goes through `correctTaskStatus`, because a report has no target state.

## TDD cycles

Tests sit next to the code as `*.test.ts`. One red, green and refactor per AC, in this order:

| Cycle | Red tests |
| --- | --- |
| 1 AC1 | partial on not-started gives in-progress; partial on blocked gives in-progress; blocker gives blocked; completed gives completed; report on completed or canceled is rejected |
| 2 AC2 | completed to in-progress; canceled to not-started; same state gives unchanged |
| 3 AC3 | in-progress task stays in-progress after a finished block; result kind is progress-unknown |
| 4 AC4 | 2 of 3 steps done; canceled step left out of total; all done gives allStepsDone and goal still active; tasks of another goal ignored |
| 5 AC5 | active goal becomes completed; completed goal gives unchanged |
| 6 AC6 | inputs deep-equal their copies after each function |

Evidence for every red and green step goes to `docs/evidence/06-progress/log.txt` with the commit SHA.

## Verification

`npm test`, `npm run typecheck`, `npm run lint` and `npm run format:check` pass after every green and refactor step; coverage for `src/domain/progress/` is reported in CI.
