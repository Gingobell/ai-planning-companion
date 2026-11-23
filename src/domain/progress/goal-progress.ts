import type { Goal, Id, Task } from "@/domain/records";

export interface GoalProgress {
  completed: number;
  // Steps that are not canceled.
  total: number;
  completedTaskIds: Id[];
  allStepsDone: boolean;
}

export function goalProgress(goal: Goal, tasks: Task[]): GoalProgress {
  void goal;
  void tasks;
  throw new Error("not implemented");
}
