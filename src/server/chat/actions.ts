"use server";

import { refresh } from "next/cache";
import { Temporal } from "temporal-polyfill";
import { getLanguageModel } from "@/llm/gemini";
import type { LanguageModel } from "@/llm/language-model";
import { captureMessage, type CaptureMessageInput } from "@/server/chat/capture-message";
import { getCurrentUser } from "@/server/session";

export type SendMessageResult = { status: "saved" } | { status: "error"; error: string };

const MAX_MESSAGE_LENGTH = 2000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const UNAVAILABLE = "The assistant can't be reached right now. Your message is kept; please send it again.";

function languageModel(): LanguageModel | undefined {
  try {
    return getLanguageModel();
  } catch {
    // A missing key is a configuration problem; the user only needs to know it did not work.
    return undefined;
  }
}

type Choice = NonNullable<CaptureMessageInput["choice"]>;

function checkText(raw: string): { text: string } | { error: string } {
  const text = raw.trim();
  if (text === "") return { error: "Type a message first." };
  if (text.length > MAX_MESSAGE_LENGTH) return { error: `Messages can be up to ${MAX_MESSAGE_LENGTH} characters.` };
  return { text };
}

// The client sends the same messageId when it retries, so a retry never creates duplicates (PRD Section 7).
async function capture(text: string, messageId: string, choice?: Choice): Promise<SendMessageResult> {
  if (!UUID.test(messageId)) return { status: "error", error: "Something went wrong. Please send it again." };
  const current = await getCurrentUser();
  if (current === undefined) return { status: "error", error: "Please sign in again." };
  const model = languageModel();
  if (model === undefined) return { status: "error", error: UNAVAILABLE };

  const settings = await current.repos.user.get();
  const result = await captureMessage({
    repos: current.repos,
    model,
    userId: current.id,
    messageId,
    text,
    now: Temporal.Now.instant().toString(),
    timeZone: settings?.timeZone ?? "UTC",
    ...(choice === undefined ? {} : { choice }),
  });
  refresh();
  switch (result.kind) {
    case "captured":
      return { status: "saved" };
    case "model-unavailable":
      return { status: "error", error: UNAVAILABLE };
    case "save-failed":
      return { status: "error", error: "Your message could not be saved. Please send it again." };
    case "question-closed":
      return { status: "error", error: "That question was already answered." };
    case "model-invalid-output":
      return {
        status: "error",
        error: "The assistant's answer could not be read. Your message is kept; please try again.",
      };
  }
}

// Saves one chat message and what it mentions.
export async function sendMessage(input: { text: string; messageId: string }): Promise<SendMessageResult> {
  const checked = checkText(input.text);
  if ("error" in checked) return { status: "error", error: checked.error };
  return capture(checked.text, input.messageId);
}

// A button pressed under an open question (DESIGN.md "Cards for decisions"); the label is shown as the
// user's message. The answer is exact, so the model does not have to read it.
export async function answerQuestion(input: {
  label: string;
  messageId: string;
  questionId: string;
  reply: Choice["reply"];
}): Promise<SendMessageResult> {
  const checked = checkText(input.label);
  if ("error" in checked) return { status: "error", error: checked.error };
  if (input.reply !== "agrees" && input.reply !== "declines") {
    return { status: "error", error: "Something went wrong. Please try again." };
  }
  return capture(checked.text, input.messageId, { questionId: input.questionId, reply: input.reply });
}
