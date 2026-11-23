import type { ProgressReport, Task } from "@/domain/records";

export type ProgressResult =
  | { kind: "updated"; task: Task }
  | { kind: "unchanged"; task: Task }
  | { kind: "rejected"; reason: "task-closed" };

export function applyProgressReport(task: Task, report: Pick<ProgressReport, "kind">): ProgressResult {
  void task;
  void report;
  throw new Error("not implemented");
}
