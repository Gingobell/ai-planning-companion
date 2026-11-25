import { Temporal } from "temporal-polyfill";
import { localDeadlineToInstant, type LocalDateTime } from "@/domain/capture/plan-capture";
import type { Deadline, Id, OpenQuestion, Task } from "@/domain/records";

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

type AnswerOutcome = { task?: Task; question?: OpenQuestion; followUp?: OpenQuestion };

const withoutProposal = ({ proposedDeadline, ...question }: OpenQuestion): OpenQuestion => {
  void proposedDeadline;
  return question;
};

const answered = (question: OpenQuestion): OpenQuestion => ({ ...withoutProposal(question), status: "answered" });

const isAfter = (at: string, now: string) => Temporal.Instant.compare(at, now) > 0;

function outcomeOf(
  answer: DeadlineAnswer,
  question: OpenQuestion,
  task: Task,
  context: ApplyDeadlineAnswersContext,
): AnswerOutcome {
  const withDeadline = (deadline: Deadline): AnswerOutcome => ({
    task: { ...task, deadline },
    question: answered(question),
  });
  switch (answer.reply) {
    case "gave-date": {
      const at = answer.date === undefined ? undefined : localDeadlineToInstant(answer.date, context.timeZone);
      if (at === undefined) return {};
      return withDeadline({ at, source: answer.dateKind === "target" ? "agreed" : "external" });
    }
    case "agrees": {
      // The assistant never invents a deadline: agreeing only counts when a target was suggested.
      const at = question.proposedDeadline;
      if (at === undefined) return {};
      // The user may answer days later; a suggestion that has passed is dropped and asked again.
      if (!isAfter(at, context.now)) {
        const cleared = withoutProposal(question);
        return { question: cleared, followUp: cleared };
      }
      return withDeadline({ at, source: "agreed" });
    }
    case "no-deadline": {
      const suggested = answer.suggestedTarget;
      const at = suggested === undefined ? undefined : localDeadlineToInstant(suggested, context.timeZone);
      if (at === undefined || !isAfter(at, context.now)) return { followUp: question };
      const proposed = { ...question, proposedDeadline: at };
      return { question: proposed, followUp: proposed };
    }
    case "declines": {
      const cleared = withoutProposal(question);
      return { question: cleared, followUp: cleared };
    }
  }
}

// Turns the user's answers to open deadline questions into record changes (PRD US-01, Section 6
// "Deadlines"): a named date is saved, a suggested target stays a proposal until the user agrees.
// Answers to unknown or already answered questions, and repeated answers, are ignored.
export function applyDeadlineAnswers(
  answers: DeadlineAnswer[],
  context: ApplyDeadlineAnswersContext,
): DeadlineAnswerChanges {
  const changes: DeadlineAnswerChanges = { tasks: [], questions: [], followUps: [] };
  const seen = new Set<number>();
  for (const answer of answers) {
    const question = context.questions[answer.questionIndex];
    if (seen.has(answer.questionIndex) || question === undefined || question.status !== "open") continue;
    seen.add(answer.questionIndex);
    const task = context.tasks.find((candidate) => candidate.id === question.taskId);
    if (task === undefined) continue;
    const outcome = outcomeOf(answer, question, task, context);
    if (outcome.task !== undefined) changes.tasks.push(outcome.task);
    if (outcome.question !== undefined) changes.questions.push(outcome.question);
    if (outcome.followUp !== undefined) changes.followUps.push(outcome.followUp);
  }
  return changes;
}
