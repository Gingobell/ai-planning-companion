import type { Id, OpenQuestion, Task } from "@/domain/records";

// A deadline question the assistant will ask in this reply; its wording comes later.
export interface DeadlineQuestion {
  id: Id;
  taskId: Id;
  proposedDeadline?: string;
}

export interface ChooseDeadlineQuestionsInput {
  // Tasks saved from the current message, in message order.
  newTasks: Task[];
  // Every question the user already has, open or answered.
  existing: OpenQuestion[];
}

export function chooseDeadlineQuestions(input: ChooseDeadlineQuestionsInput): DeadlineQuestion[] {
  void input;
  throw new Error("not implemented");
}
