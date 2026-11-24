import { describe, expect, it } from "vitest";
import { chooseDeadlineQuestions } from "@/domain/clarification/deadline-questions";
import type { OpenQuestion, Task } from "@/domain/records";

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

const question = (taskId: string, extra: Partial<OpenQuestion> = {}): OpenQuestion => ({
  id: `${taskId}:deadline`,
  userId: "alice",
  version: 1,
  taskId,
  topic: "deadline",
  question: `When is ${taskId} due?`,
  status: "open",
  ...extra,
});

describe("chooseDeadlineQuestions: a few questions at a time, never repeated (Q3)", () => {
  it("asks at most two questions in one reply, in message order", () => {
    const asked = chooseDeadlineQuestions({ newTasks: [task("t1"), task("t2"), task("t3")], existing: [] });
    expect(asked.map((q) => q.taskId)).toEqual(["t1", "t2"]);
  });

  it("does not ask again about a task that already has a deadline question", () => {
    const existing = [question("t1"), question("t2", { status: "answered" })];
    expect(chooseDeadlineQuestions({ newTasks: [task("t1"), task("t2")], existing })).toEqual([]);
  });

  it("puts follow-ups on this message's answers first, with their suggested target date", () => {
    const followUp = question("t0", { proposedDeadline: "2026-12-04T04:59:00Z" });
    const asked = chooseDeadlineQuestions({
      newTasks: [task("t1"), task("t2")],
      existing: [followUp],
      followUps: [followUp],
    });
    expect(asked).toEqual([
      { id: "t0:deadline", taskId: "t0", proposedDeadline: "2026-12-04T04:59:00Z" },
      { id: "t1:deadline", taskId: "t1" },
    ]);
  });
});
