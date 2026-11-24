import type { Goal, Id, Task } from "@/domain/records";

export interface GoalProgress {
  completed: number;
  // Steps that are not canceled.
  total: number;
  completedTaskIds: Id[];
  allStepsDone: boolean;
}

// Every step done is reported, not acted on: only the user confirms that a goal is complete.
// Steps are matched by goalId only, so callers set goalId on every step, including sub-steps
// that also have a parentTaskId.
export function goalProgress(goal: Goal, tasks: Task[]): GoalProgress {
  const steps = tasks.filter((task) => task.goalId === goal.id && task.status !== "canceled");
  const completedTaskIds = steps.filter((task) => task.status === "completed").map((task) => task.id);
  return {
    completed: completedTaskIds.length,
    total: steps.length,
    completedTaskIds,
    allStepsDone: steps.length > 0 && completedTaskIds.length === steps.length,
  };
}

// Called only after the user confirms that the goal's outcome has been reached.
export function confirmGoalCompleted(goal: Goal): { kind: "updated" | "unchanged"; goal: Goal } {
  if (goal.status !== "active") return { kind: "unchanged", goal };
  return { kind: "updated", goal: { ...goal, status: "completed" } };
}
