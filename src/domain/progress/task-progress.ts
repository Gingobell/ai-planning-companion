import type { ProgressReport, ProgressReportKind, Task, TaskStatus } from "@/domain/records";

export type ProgressResult =
  | { kind: "updated"; task: Task }
  | { kind: "unchanged"; task: Task }
  | { kind: "rejected"; reason: "task-closed" };

// A correction report carries no target state; the state change goes through correctTaskStatus.
const statusAfterReport: Record<ProgressReportKind, TaskStatus | undefined> = {
  partial: "in-progress",
  blocker: "blocked",
  completed: "completed",
  correction: undefined,
};

function isClosed(status: TaskStatus): boolean {
  return status === "completed" || status === "canceled";
}

export function applyProgressReport(task: Task, report: Pick<ProgressReport, "kind">): ProgressResult {
  if (isClosed(task.status)) return { kind: "rejected", reason: "task-closed" };
  const next = statusAfterReport[report.kind];
  if (next === undefined || next === task.status) return { kind: "unchanged", task };
  return { kind: "updated", task: { ...task, status: next } };
}

// A user correction may set any state, including reopening a closed task.
export function correctTaskStatus(task: Task, status: TaskStatus): ProgressResult {
  if (status === task.status) return { kind: "unchanged", task };
  return { kind: "updated", task: { ...task, status } };
}
