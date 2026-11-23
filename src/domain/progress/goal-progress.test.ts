import { describe, expect, it } from "vitest";
import type { Goal, Task, TaskStatus } from "@/domain/records";
import { goalProgress } from "@/domain/progress/goal-progress";

const goal: Goal = {
  id: "goal-1",
  userId: "user-1",
  version: 2,
  title: "Land a summer internship",
  category: "Career",
  horizon: "long",
  status: "active",
};

function step(id: string, status: TaskStatus, goalId = "goal-1"): Task {
  return {
    id,
    userId: "user-1",
    version: 1,
    title: `Step ${id}`,
    category: "Career",
    goalId,
    priority: "medium",
    status,
    remindersEnabled: false,
    acceptance: "accepted",
  };
}

describe("goalProgress", () => {
  describe("AC4: goal progress counts completed steps and never completes the goal", () => {
    it("counts completed steps out of all steps", () => {
      const tasks = [step("a", "completed"), step("b", "completed"), step("c", "in-progress")];
      expect(goalProgress(goal, tasks)).toEqual({
        completed: 2,
        total: 3,
        completedTaskIds: ["a", "b"],
        allStepsDone: false,
      });
    });

    it("leaves canceled steps out of the total", () => {
      const tasks = [step("a", "completed"), step("b", "canceled"), step("c", "not-started")];
      expect(goalProgress(goal, tasks)).toMatchObject({ completed: 1, total: 2 });
    });

    it("ignores tasks that belong to another goal", () => {
      const tasks = [step("a", "completed"), step("x", "not-started", "goal-2")];
      expect(goalProgress(goal, tasks)).toMatchObject({ completed: 1, total: 1 });
    });

    it("reports all steps done without marking the goal completed", () => {
      const tasks = [step("a", "completed"), step("b", "completed")];
      expect(goalProgress(goal, tasks)).toMatchObject({ allStepsDone: true });
      expect(goal.status).toBe("active");
    });

    it("does not report all steps done for a goal without steps", () => {
      expect(goalProgress(goal, [])).toEqual({ completed: 0, total: 0, completedTaskIds: [], allStepsDone: false });
    });
  });
});
