import { describe, expect, it } from "vitest";
import type { Task, TaskStatus, TimeBlock } from "@/domain/records";
import { applyProgressReport, correctTaskStatus, finishTimeBlock } from "@/domain/progress/task-progress";

function task(status: TaskStatus): Task {
  return {
    id: "task-1",
    userId: "user-1",
    version: 3,
    title: "Write the lab report",
    category: "Coursework",
    priority: "medium",
    status,
    remindersEnabled: false,
    acceptance: "accepted",
  };
}

describe("applyProgressReport", () => {
  describe("AC1: a progress report changes the task state", () => {
    it("moves a not-started task to in-progress on partial progress", () => {
      expect(applyProgressReport(task("not-started"), { kind: "partial" })).toEqual({
        kind: "updated",
        task: task("in-progress"),
      });
    });

    it("moves a blocked task back to in-progress on partial progress", () => {
      expect(applyProgressReport(task("blocked"), { kind: "partial" })).toEqual({
        kind: "updated",
        task: task("in-progress"),
      });
    });

    it("keeps an in-progress task in progress on partial progress", () => {
      expect(applyProgressReport(task("in-progress"), { kind: "partial" })).toEqual({
        kind: "unchanged",
        task: task("in-progress"),
      });
    });

    it("moves a task to blocked when the user reports a blocker", () => {
      expect(applyProgressReport(task("in-progress"), { kind: "blocker" })).toEqual({
        kind: "updated",
        task: task("blocked"),
      });
    });

    it("moves a task to completed when the user reports it done", () => {
      expect(applyProgressReport(task("in-progress"), { kind: "completed" })).toEqual({
        kind: "updated",
        task: task("completed"),
      });
    });

    it.each<TaskStatus>(["completed", "canceled"])("rejects a report on a %s task", (status) => {
      expect(applyProgressReport(task(status), { kind: "partial" })).toEqual({
        kind: "rejected",
        reason: "task-closed",
      });
    });
  });
});

describe("correctTaskStatus", () => {
  describe("AC2: the user can correct a task's state", () => {
    it("reopens a completed task as in-progress", () => {
      expect(correctTaskStatus(task("completed"), "in-progress")).toEqual({
        kind: "updated",
        task: task("in-progress"),
      });
    });

    it("restores a canceled task to not-started", () => {
      expect(correctTaskStatus(task("canceled"), "not-started")).toEqual({
        kind: "updated",
        task: task("not-started"),
      });
    });

    it("moves a not-started task straight to completed", () => {
      expect(correctTaskStatus(task("not-started"), "completed")).toEqual({
        kind: "updated",
        task: task("completed"),
      });
    });

    it("returns unchanged when the task already has that state", () => {
      expect(correctTaskStatus(task("blocked"), "blocked")).toEqual({
        kind: "unchanged",
        task: task("blocked"),
      });
    });
  });
});

describe("finishTimeBlock", () => {
  const block: TimeBlock = {
    id: "block-1",
    userId: "user-1",
    version: 1,
    taskId: "task-1",
    start: "2026-11-24T17:00:00Z",
    end: "2026-11-24T18:30:00Z",
    status: "accepted",
  };

  describe("AC3: finishing a time block does not complete its task", () => {
    it.each<TaskStatus>(["not-started", "in-progress", "blocked"])("keeps a %s task in its state", (status) => {
      expect(finishTimeBlock(task(status), block)).toEqual({ kind: "progress-unknown", task: task(status) });
    });
  });
});
