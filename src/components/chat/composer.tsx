"use client";

import { useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { sendMessage } from "@/server/chat/actions";

// The message box (DESIGN.md: composer at --h-lg, inset shadow). Text stays in the box while saving and
// after a failure, and a retry reuses the same message id so nothing is saved twice (PRD Section 7).
export function Composer() {
  const [text, setText] = useState("");
  // Made on the first send and kept until it succeeds, so a retry reuses it. Not made during render,
  // because Next.js prerenders this component and a random value there would differ per request.
  const [messageId, setMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (pending || text.trim() === "") return;
    const id = messageId ?? crypto.randomUUID();
    setMessageId(id);
    startTransition(async () => {
      const result = await sendMessage({ text, messageId: id });
      if (result.status === "saved") {
        setText("");
        setMessageId(null);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  // Enter sends; Shift+Enter starts a new line; Enter while composing CJK text is left to the input method.
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) submit(event);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-s2">
      {error && (
        <p role="alert" className="rounded-md bg-rose-soft px-pad-sm py-s2 text-sm text-rose">
          {error}
        </p>
      )}
      <div className="flex min-h-control-lg items-center gap-s2 rounded-xl bg-surface-3 px-s2 py-s1 shadow-inset">
        <label htmlFor="composer" className="sr-only">
          Message
        </label>
        <textarea
          id="composer"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={2000}
          placeholder="Tell me about a goal or task in a sentence"
          className="flex-1 resize-none bg-transparent px-pad-sm py-s2 text-chat text-ink placeholder:text-muted focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={pending || text.trim() === ""}
          className="inline-flex h-control-md shrink-0 items-center justify-center rounded-md bg-accent px-pad-md text-control leading-none font-semibold text-on-accent shadow-raised active:translate-y-px disabled:opacity-60"
        >
          {pending ? "Saving…" : "Send"}
        </button>
      </div>
    </form>
  );
}
