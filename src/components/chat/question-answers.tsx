"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { answerQuestion, sendMessage, type SendMessageResult } from "@/server/chat/actions";

export interface AskedQuestion {
  id: string;
  taskTitle: string;
  // The suggested target date as the user reads it; present when the question waits for Accept.
  proposed?: string;
}

const focusComposer = () => document.getElementById("composer")?.focus();

// Answers under the reply that asked (DESIGN.md section 10): a suggested target date is a decision card
// with Accept and Another time; other questions list likely answers, numbered, ending with
// "Type my own answer". Typing in the composer always works too.
export function QuestionAnswers({ questions }: { questions: AskedQuestion[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // One message id per answer, kept until it succeeds, so a retry saves nothing twice (PRD Section 7).
  const ids = useRef(new Map<string, string>());

  function run(key: string, send: (messageId: string) => Promise<SendMessageResult>) {
    if (pending) return;
    const messageId = ids.current.get(key) ?? crypto.randomUUID();
    ids.current.set(key, messageId);
    startTransition(async () => {
      const result = await send(messageId);
      if (result.status === "saved") {
        ids.current.delete(key);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  const decisions = questions.filter((question) => question.proposed !== undefined);
  const openEnded = questions.filter((question) => question.proposed === undefined);
  const options = [
    ...openEnded.map((question) => ({
      label: `"${question.taskTitle}" has no fixed date, suggest a target`,
      pick: () =>
        run(`${question.id}:no-deadline`, (messageId) =>
          sendMessage({ text: `"${question.taskTitle}" has no fixed date. Please suggest a target.`, messageId }),
        ),
    })),
    ...(openEnded.length === 0 ? [] : [{ label: "Type my own answer", pick: focusComposer }]),
  ];

  // Number keys pick an answer while the composer is not focused.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable]") || event.metaKey || event.ctrlKey || event.altKey)
        return;
      const option = optionsRef.current[Number(event.key) - 1];
      if (option === undefined) return;
      event.preventDefault();
      option.pick();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex flex-col gap-s3 pl-[calc(var(--h-sm)+var(--s3))]">
      {decisions.map((question) => (
        <section
          key={question.id}
          aria-label={`Suggested target date for ${question.taskTitle}`}
          className="flex flex-col gap-s3 rounded-lg border border-accent-line bg-surface p-s4"
        >
          <div className="flex flex-wrap items-center gap-s2">
            <span className="inline-flex h-control-xs items-center self-center rounded-pill bg-blue-soft px-pad-xs text-xs leading-none font-semibold text-blue">
              Suggestion
            </span>
            <span className="min-w-0 text-sm break-words text-muted">Target date for “{question.taskTitle}”</span>
          </div>
          <p className="text-xl font-medium tabular-nums text-ink">{question.proposed}</p>
          <div className="flex flex-wrap items-center gap-s2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(`${question.id}:agrees`, (messageId) =>
                  answerQuestion({
                    label: `Accept ${question.proposed}`,
                    messageId,
                    questionId: question.id,
                    reply: "agrees",
                  }),
                )
              }
              className="inline-flex h-control-md items-center justify-center self-center rounded-md bg-accent px-pad-md text-control leading-none font-semibold text-on-accent shadow-raised active:translate-y-px active:shadow-inset disabled:opacity-60"
            >
              Accept
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(`${question.id}:declines`, (messageId) =>
                  answerQuestion({ label: "Another time", messageId, questionId: question.id, reply: "declines" }),
                )
              }
              className="inline-flex h-control-md items-center justify-center self-center rounded-md bg-surface px-pad-md text-control leading-none font-semibold text-ink-2 shadow-raised active:translate-y-px active:shadow-inset disabled:opacity-60"
            >
              Another time
            </button>
          </div>
        </section>
      ))}
      {options.length > 0 && (
        <ol aria-label="Suggested answers" className="flex flex-col gap-s2">
          {options.map((option, index) => (
            <li key={option.label}>
              <button
                type="button"
                disabled={pending}
                onClick={option.pick}
                className="flex min-h-control-md w-full items-center gap-s3 rounded-md bg-surface-2 px-pad-md py-s2 text-left text-control leading-[1.35] font-semibold text-ink-2 shadow-raised active:translate-y-px active:shadow-inset disabled:opacity-60"
              >
                <kbd className="inline-flex h-control-2xs min-w-control-2xs shrink-0 items-center justify-center self-center rounded-sm bg-surface px-pad-xs text-xs leading-none font-semibold text-muted tabular-nums">
                  {index + 1}
                </kbd>
                <span className="min-w-0 break-words">{option.label}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {pending && <p className="text-sm text-muted">Saving…</p>}
      {error && (
        <p role="alert" className="rounded-md bg-rose-soft px-pad-sm py-s2 text-sm text-rose">
          {error}
        </p>
      )}
    </div>
  );
}
