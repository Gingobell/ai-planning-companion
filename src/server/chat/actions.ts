"use server";

import { refresh } from "next/cache";
import { Temporal } from "temporal-polyfill";
import { getLanguageModel } from "@/llm/gemini";
import type { LanguageModel } from "@/llm/language-model";
import { captureMessage } from "@/server/chat/capture-message";
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

// Saves one chat message and what it mentions. The client sends the same messageId when it retries,
// so a retry never creates duplicates (PRD Section 7).
export async function sendMessage(input: { text: string; messageId: string }): Promise<SendMessageResult> {
  const text = input.text.trim();
  if (text === "") return { status: "error", error: "Type a message first." };
  if (text.length > MAX_MESSAGE_LENGTH) {
    return { status: "error", error: `Messages can be up to ${MAX_MESSAGE_LENGTH} characters.` };
  }
  if (!UUID.test(input.messageId)) return { status: "error", error: "Something went wrong. Please send it again." };

  const current = await getCurrentUser();
  if (current === undefined) return { status: "error", error: "Please sign in again." };
  const model = languageModel();
  if (model === undefined) return { status: "error", error: UNAVAILABLE };

  const settings = await current.repos.user.get();
  const result = await captureMessage({
    repos: current.repos,
    model,
    userId: current.id,
    messageId: input.messageId,
    text,
    now: Temporal.Now.instant().toString(),
    timeZone: settings?.timeZone ?? "UTC",
  });
  refresh();
  if (result.kind === "captured") return { status: "saved" };
  if (result.kind === "model-unavailable") return { status: "error", error: UNAVAILABLE };
  if (result.kind === "save-failed") {
    return { status: "error", error: "Your message could not be saved. Please send it again." };
  }
  return {
    status: "error",
    error: "The assistant's answer could not be read. Your message is kept; please try again.",
  };
}
