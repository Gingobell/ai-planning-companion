import { describe, expect, it } from "vitest";
import type { Goal, Task, TimeBlock } from "@/domain/records";
import { applyProgressReport, correctTaskStatus, finishTimeBlock } from "@/domain/progress/task-progress";
import { confirmGoalCompleted, goalProgress } from "@/domain/progress/goal-progress";

const task: Task = {
  id: "task-1",
  userId: "user-1",
  version: 1,
  title: "Draft the cover letter",
  category: "Career",
  goalId: "goal-1",
  priority: "high",
  status: "in-progress",
  remindersEnabled: true,
  acceptance: "accepted",
};

const goal: Goal = {
  id: "goal-1",
  userId: "user-1",
  version: 1,
  title: "Land a summer internship",
  category: "Career",
  horizon: "long",
  status: "active",
};

const block: TimeBlock = {
  id: "block-1",
  userId: "user-1",
  version: 1,
  taskId: "task-1",
  start: "2026-11-24T17:00:00Z",
  end: "2026-11-24T18:00:00Z",
  status: "accepted",
};

describe("AC6: progress rules never mutate their inputs", () => {
  it.each([
    ["applyProgressReport", () => applyProgressReport(task, { kind: "completed" })],
    ["correctTaskStatus", () => correctTaskStatus(task, "blocked")],
    ["finishTimeBlock", () => finishTimeBlock(task, block)],
    ["goalProgress", () => goalProgress(goal, [task])],
    ["confirmGoalCompleted", () => confirmGoalCompleted(goal)],
  ])("%s leaves its inputs unchanged", (_name, call) => {
    const before = structuredClone({ task, goal, block });
    call();
    expect({ task, goal, block }).toEqual(before);
  });
});
