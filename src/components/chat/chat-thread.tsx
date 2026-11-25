import { Temporal } from "temporal-polyfill";
import { RouteMark } from "@/components/app-shell/route-mark";
import { QuestionAnswers, type AskedQuestion } from "@/components/chat/question-answers";
import { describeDeadline } from "@/server/chat/capture-message";
import { getCurrentUser } from "@/server/session";

// Today's conversation in the user's time zone (one chat per local day, PRD Section 6).
// Reads the session, so it renders inside Suspense.
export async function ChatThread() {
  const current = await getCurrentUser();
  if (current === undefined) return null;
  const settings = await current.repos.user.get();
  const timeZone = settings?.timeZone ?? "UTC";
  const today = Temporal.Now.zonedDateTimeISO(timeZone).toPlainDate().toString();
  const messages = await current.repos.messages.listByChatDate(today);

  // Answers show only under the latest reply, for the questions it asked that are still open.
  const latest = messages.at(-1);
  const asked: AskedQuestion[] = [];
  if (latest?.role === "assistant") {
    const [questions, tasks] = await Promise.all([current.repos.openQuestions.list(), current.repos.tasks.list()]);
    for (const question of questions) {
      if (question.status !== "open" || question.askedIn !== latest.id) continue;
      asked.push({
        id: question.id,
        taskTitle: tasks.find((task) => task.id === question.taskId)?.title ?? "",
        ...(question.proposedDeadline === undefined
          ? {}
          : { proposed: describeDeadline(question.proposedDeadline, timeZone) }),
      });
    }
  }

  if (messages.length === 0) {
    return (
      <p className="text-chat text-muted">Tell me about a goal or task in a sentence, and I will save it first.</p>
    );
  }
  return (
    <ol className="flex flex-col gap-s4" aria-label="Today's conversation">
      {messages.map((message) =>
        message.role === "user" ? (
          <li
            key={message.id}
            className="self-end rounded-lg bg-surface-3 px-s4 py-[calc(var(--s2)+2px)] text-chat break-words whitespace-pre-wrap text-ink-2"
          >
            {message.text}
          </li>
        ) : (
          <li key={message.id} className="flex items-start gap-s3">
            <span className="inline-flex size-control-sm shrink-0 items-center justify-center rounded-pill bg-accent-soft text-accent">
              <RouteMark className="size-s4" />
            </span>
            <p className="text-chat break-words text-ink">{message.text}</p>
          </li>
        ),
      )}
      {asked.length > 0 && (
        <li>
          <QuestionAnswers questions={asked} />
        </li>
      )}
    </ol>
  );
}
