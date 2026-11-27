import { z } from "zod";

// Only structured facts that were already saved or decided; the model words them and adds nothing.
export interface ReplyFacts {
  userMessage: string;
  saved: { goals: string[]; tasks: { title: string; due?: string }[] };
  deadlinesSet: { task: string; due: string; kind: "due date" | "agreed target" }[];
  questions: { task: string; suggestedTarget?: string }[];
}

export const replySchema = z.object({
  reply: z.string().min(1).max(1200).describe("The whole reply shown to the user"),
  questions: z
    .array(z.string().min(1).max(300))
    .describe("Each entry of questions, in order, worded exactly as it appears in the reply"),
});

export function replySystemPrompt(): string {
  return [
    "You write a planning assistant's short chat reply. Write it in the language of userMessage.",
    "Confirm only what saved and deadlinesSet contain, keeping titles and dates as given; add no other facts.",
    "Then ask each entry of questions in order: without suggestedTarget, ask when the task is due and offer to",
    "suggest a target date if there is none; with suggestedTarget, propose that date as a target and ask the",
    "user to agree. Return each question's wording in questions. No markdown.",
  ].join(" ");
}

export function replyPrompt(facts: ReplyFacts): string {
  return JSON.stringify(facts);
}
