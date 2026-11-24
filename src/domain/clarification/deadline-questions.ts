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
  // Questions the user answered in this message that still need a reply, such as a suggested target date.
  followUps?: OpenQuestion[];
}

// One deadline question per task, so its id can never be asked twice.
export const deadlineQuestionId = (taskId: Id): Id => `${taskId}:deadline`;

// Only work still to do needs a deadline before it can be scheduled (PRD Section 6, "Deadlines").
const needsDeadline = (task: Task) =>
  task.deadline === undefined && task.status !== "completed" && task.status !== "canceled";

// "A few questions at a time" (PRD US-01): more would bury the one that matters most.
export const MAX_QUESTIONS_PER_REPLY = 2;

// Follow-ups on what the user just answered come first, then new tasks in message order. Older open
// questions the user did not touch are not asked again here, so the user is not asked on every message.
export function chooseDeadlineQuestions(input: ChooseDeadlineQuestionsInput): DeadlineQuestion[] {
  const followUps = (input.followUps ?? []).flatMap((question): DeadlineQuestion[] =>
    question.taskId === undefined || question.status !== "open"
      ? []
      : [
          {
            id: question.id,
            taskId: question.taskId,
            ...(question.proposedDeadline === undefined ? {} : { proposedDeadline: question.proposedDeadline }),
          },
        ],
  );
  const known = new Set([...input.existing.map((question) => question.id), ...followUps.map((q) => q.id)]);
  const fresh = input.newTasks
    .filter((task) => needsDeadline(task) && !known.has(deadlineQuestionId(task.id)))
    .map((task) => ({ id: deadlineQuestionId(task.id), taskId: task.id }));
  return [...followUps, ...fresh].slice(0, MAX_QUESTIONS_PER_REPLY);
}
