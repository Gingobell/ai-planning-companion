import { z } from "zod";

const localDateTime = z.object({
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  localTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

// The shape the model must return for a captured message. Checked by generateValidated before
// planCapture and applyDeadlineAnswers see it; field descriptions travel to the model inside the derived JSON Schema.
export const captureExtractionSchema = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(["goal", "task"]).describe("goal: a desired outcome; task: one concrete action"),
        title: z.string().min(1).describe("Short title in the user's own words and language"),
        category: z.string().min(1).describe("A short suggested category, such as School, Career or Health"),
        horizon: z.enum(["short", "long"]).optional().describe("Goals only: long for open-ended outcomes"),
        goalIndex: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Tasks only: index in items of the goal this task serves, if the message links them"),
        deadline: localDateTime
          .extend({
            statedByUser: z.boolean().describe("True only if the user gave this date; false for any guess"),
          })
          .optional()
          .describe("Only when the message names a due date"),
      }),
    )
    .describe("Every new goal or task the message mentions; empty if none"),
  answers: z
    .array(
      z.object({
        questionIndex: z.number().int().min(0).describe("Number of the open question this answers"),
        reply: z
          .enum(["gave-date", "no-deadline", "agrees", "declines"])
          .describe(
            "gave-date: the user named a date; no-deadline: there is no fixed date or the user is unsure; " +
              "agrees: the user accepts the suggested target date; declines: the user rejects it",
          ),
        date: localDateTime.optional().describe("gave-date only: the date the user named"),
        dateKind: z
          .enum(["external", "target"])
          .optional()
          .describe("gave-date only: external when the work is due then; target when the user picked the date"),
        suggestedTarget: localDateTime
          .optional()
          .describe("no-deadline only: a realistic target date after the current date that you suggest"),
      }),
    )
    .optional()
    .describe("How the message answers the open deadline questions listed in the prompt; empty if it answers none"),
});

export function captureSystemPrompt(): string {
  return [
    "You extract goals and tasks from one message a user sends to a planning assistant.",
    "Return every goal or task the message mentions, and nothing the message does not mention.",
    "A goal is a desired outcome (land an internship); a task is one concrete action (submit lab 5).",
    "Never invent a deadline. Include one only when the message names a date or day; resolve relative",
    "days such as 'Thursday' against the current local date given in the prompt, and set statedByUser",
    "to true only when the user said it. Keep titles in the user's language.",
    "If the prompt lists open deadline questions, report in answers how the message answers each of them;",
    "an answer is not a new task. When the user has no fixed date or is unsure, suggest a realistic target date.",
  ].join(" ");
}

// An open deadline question as the model sees it: the task's title and any target date already suggested.
export interface OpenDeadlineQuestionPrompt {
  taskTitle: string;
  suggestedTarget?: string;
}

export function capturePrompt(
  text: string,
  localNow: string,
  timeZone: string,
  openQuestions: OpenDeadlineQuestionPrompt[] = [],
): string {
  const questions = openQuestions.map(
    (question, index) =>
      `${index}. When is "${question.taskTitle}" due?` +
      (question.suggestedTarget === undefined ? "" : ` Suggested target: ${question.suggestedTarget}.`),
  );
  const listed = questions.length === 0 ? "" : `\nOpen deadline questions:\n${questions.join("\n")}`;
  return `Current local date and time: ${localNow} (${timeZone}).${listed}\nMessage: ${text}`;
}
