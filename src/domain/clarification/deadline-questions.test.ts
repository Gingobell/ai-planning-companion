import { describe, expect, it } from "vitest";
import { chooseDeadlineQuestions } from "@/domain/clarification/deadline-questions";
import type { Task } from "@/domain/records";

const task = (id: string, extra: Partial<Task> = {}): Task => ({
  id,
  userId: "alice",
  version: 1,
  title: `Task ${id}`,
  category: "School",
  priority: "medium",
  status: "not-started",
  remindersEnabled: false,
  acceptance: "accepted",
  ...extra,
});

describe("chooseDeadlineQuestions: a deadline question for each new task without one (Q1)", () => {
  it("asks for the deadline of a new task that has none", () => {
    expect(chooseDeadlineQuestions({ newTasks: [task("t1")], existing: [] })).toEqual([
      { id: "t1:deadline", taskId: "t1" },
    ]);
  });

  it("does not ask when the user already stated the deadline", () => {
    const withDeadline = task("t1", { deadline: { at: "2026-11-27T04:59:00Z", source: "external" } });
    expect(chooseDeadlineQuestions({ newTasks: [withDeadline], existing: [] })).toEqual([]);
  });

  it("does not ask about completed or canceled tasks", () => {
    const done = [task("t1", { status: "completed" }), task("t2", { status: "canceled" })];
    expect(chooseDeadlineQuestions({ newTasks: done, existing: [] })).toEqual([]);
  });
});
