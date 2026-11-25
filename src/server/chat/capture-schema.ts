import { z } from "zod";

// The shape the model must return for a captured message. Checked by generateValidated before
// planCapture sees it; field descriptions travel to the model inside the derived JSON Schema.
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
        deadline: z
          .object({
            localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            localTime: z
              .string()
              .regex(/^\d{2}:\d{2}$/)
              .optional(),
            statedByUser: z.boolean().describe("True only if the user gave this date; false for any guess"),
          })
          .optional()
          .describe("Only when the message names a due date"),
      }),
    )
    .describe("Every goal or task the message mentions; empty if none"),
});

export function captureSystemPrompt(): string {
  return [
    "You extract goals and tasks from one message a user sends to a planning assistant.",
    "Return every goal or task the message mentions, and nothing the message does not mention.",
    "A goal is a desired outcome (land an internship); a task is one concrete action (submit lab 5).",
    "Never invent a deadline. Include one only when the message names a date or day; resolve relative",
    "days such as 'Thursday' against the current local date given in the prompt, and set statedByUser",
    "to true only when the user said it. Keep titles in the user's language.",
  ].join(" ");
}

export function capturePrompt(text: string, localNow: string, timeZone: string): string {
  return `Current local date and time: ${localNow} (${timeZone}).\nMessage: ${text}`;
}
