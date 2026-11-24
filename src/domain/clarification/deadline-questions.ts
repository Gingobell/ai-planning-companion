import type { LocalDateTime } from "@/domain/capture/plan-capture";
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

// How the user answered one open deadline question, as the model read it. It is a proposal:
// applyDeadlineAnswers decides what changes.
export interface DeadlineAnswer {
  // Position of the question in the list the model was shown.
  questionIndex: number;
  reply: "gave-date" | "no-deadline" | "agrees" | "declines";
  // gave-date: the date the user named; "target" when the user picked it, "external" when it is due then.
  date?: LocalDateTime;
  dateKind?: "external" | "target";
  // no-deadline: a target date the assistant suggests, saved only as a proposal.
  suggestedTarget?: LocalDateTime;
}

export interface ApplyDeadlineAnswersContext {
  // The open questions in the order the model was shown them.
  questions: OpenQuestion[];
  tasks: Task[];
  now: string;
  timeZone: string;
}

export interface DeadlineAnswerChanges {
  // Only records that changed.
  tasks: Task[];
  questions: OpenQuestion[];
  // Changed questions that are still open and need a reply in this message.
  followUps: OpenQuestion[];
}

export function applyDeadlineAnswers(
  answers: DeadlineAnswer[],
  context: ApplyDeadlineAnswersContext,
): DeadlineAnswerChanges {
  void answers;
  void context;
  throw new Error("not implemented");
}
