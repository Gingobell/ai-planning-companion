import { describe, expect, it } from "vitest";
import { applyDeadlineAnswers, chooseDeadlineQuestions } from "@/domain/clarification/deadline-questions";
import type { OpenQuestion, Task } from "@/domain/records";

const task = (id: string, extra: Partial<Task> = {}): Task => ({
  id,
  userId: "alice",
  version: 1,
  title: `Task ${id}`,
  category: "School",
  priority: "medium",
  status: "not-started",
  remindersEnabled: false,
  acceptance: "accepted",
  ...extra,
});

describe("chooseDeadlineQuestions: a deadline question for each new task without one (Q1)", () => {
  it("asks for the deadline of a new task that has none", () => {
    expect(chooseDeadlineQuestions({ newTasks: [task("t1")], existing: [] })).toEqual([
      { id: "t1:deadline", taskId: "t1" },
    ]);
  });

  it("does not ask when the user already stated the deadline", () => {
    const withDeadline = task("t1", { deadline: { at: "2026-11-27T04:59:00Z", source: "external" } });
    expect(chooseDeadlineQuestions({ newTasks: [withDeadline], existing: [] })).toEqual([]);
  });

  it("does not ask about completed or canceled tasks", () => {
    const done = [task("t1", { status: "completed" }), task("t2", { status: "canceled" })];
    expect(chooseDeadlineQuestions({ newTasks: done, existing: [] })).toEqual([]);
  });
});

const question = (taskId: string, extra: Partial<OpenQuestion> = {}): OpenQuestion => ({
  id: `${taskId}:deadline`,
  userId: "alice",
  version: 1,
  taskId,
  topic: "deadline",
  question: `When is ${taskId} due?`,
  status: "open",
  ...extra,
});

describe("chooseDeadlineQuestions: a few questions at a time, never repeated (Q3)", () => {
  it("asks at most two questions in one reply, in message order", () => {
    const asked = chooseDeadlineQuestions({ newTasks: [task("t1"), task("t2"), task("t3")], existing: [] });
    expect(asked.map((q) => q.taskId)).toEqual(["t1", "t2"]);
  });

  it("does not ask again about a task that already has a deadline question", () => {
    const existing = [question("t1"), question("t2", { status: "answered" })];
    expect(chooseDeadlineQuestions({ newTasks: [task("t1"), task("t2")], existing })).toEqual([]);
  });

  it("puts follow-ups on this message's answers first, with their suggested target date", () => {
    const followUp = question("t0", { proposedDeadline: "2026-12-04T04:59:00Z" });
    const asked = chooseDeadlineQuestions({
      newTasks: [task("t1"), task("t2")],
      existing: [followUp],
      followUps: [followUp],
    });
    expect(asked).toEqual([
      { id: "t0:deadline", taskId: "t0", proposedDeadline: "2026-12-04T04:59:00Z" },
      { id: "t1:deadline", taskId: "t1" },
    ]);
  });
});

describe("applyDeadlineAnswers: a target date is saved only after the user agrees (Q2)", () => {
  // Tuesday, Nov 24, 2026, noon in Los Angeles.
  const context = (questions: OpenQuestion[]) => ({
    questions,
    tasks: [task("t1")],
    now: "2026-11-24T20:00:00Z",
    timeZone: "America/Los_Angeles",
  });
  // Friday, Dec 4, 2026, 11:59 pm in Los Angeles.
  const DEC_4 = "2026-12-05T07:59:00Z";

  it("stores a suggested target date as a proposal and leaves the task without a deadline", () => {
    const changes = applyDeadlineAnswers(
      [{ questionIndex: 0, reply: "no-deadline", suggestedTarget: { localDate: "2026-12-04" } }],
      context([question("t1")]),
    );
    expect(changes.tasks).toEqual([]);
    expect(changes.questions).toEqual([question("t1", { proposedDeadline: DEC_4 })]);
    expect(changes.followUps).toEqual(changes.questions);
  });

  it("saves the proposal as an agreed deadline when the user agrees", () => {
    const changes = applyDeadlineAnswers(
      [{ questionIndex: 0, reply: "agrees" }],
      context([question("t1", { proposedDeadline: DEC_4 })]),
    );
    expect(changes.tasks).toEqual([task("t1", { deadline: { at: DEC_4, source: "agreed" } })]);
    expect(changes.questions).toEqual([question("t1", { status: "answered" })]);
    expect(changes.followUps).toEqual([]);
  });

  it("changes nothing when the user agrees but no target date was suggested", () => {
    const changes = applyDeadlineAnswers([{ questionIndex: 0, reply: "agrees" }], context([question("t1")]));
    expect(changes).toEqual({ tasks: [], questions: [], followUps: [] });
  });

  it("does not save a proposal that has passed when the user agrees, and asks again", () => {
    const passed = question("t1", { proposedDeadline: "2026-11-21T07:59:00Z" });
    const changes = applyDeadlineAnswers([{ questionIndex: 0, reply: "agrees" }], context([passed]));
    expect(changes.tasks).toEqual([]);
    expect(changes.questions).toEqual([question("t1")]);
    expect(changes.followUps).toEqual([question("t1")]);
  });

  it("does not propose a target date in the past or an impossible date", () => {
    for (const localDate of ["2026-11-20", "2026-02-30"]) {
      const changes = applyDeadlineAnswers(
        [{ questionIndex: 0, reply: "no-deadline", suggestedTarget: { localDate } }],
        context([question("t1")]),
      );
      expect(changes.tasks).toEqual([]);
      expect(changes.questions.some((q) => q.proposedDeadline !== undefined)).toBe(false);
    }
  });

  it("clears the proposal when the user declines, and keeps the question open", () => {
    const changes = applyDeadlineAnswers(
      [{ questionIndex: 0, reply: "declines" }],
      context([question("t1", { proposedDeadline: DEC_4 })]),
    );
    expect(changes.tasks).toEqual([]);
    expect(changes.questions).toEqual([question("t1")]);
    expect(changes.followUps).toEqual([question("t1")]);
  });

  it("saves a date the user names: external when it is due then, agreed when the user picks it", () => {
    for (const [dateKind, source] of [
      ["external", "external"],
      ["target", "agreed"],
    ] as const) {
      const changes = applyDeadlineAnswers(
        [{ questionIndex: 0, reply: "gave-date", date: { localDate: "2026-12-04" }, dateKind, statedByUser: true }],
        context([question("t1", { proposedDeadline: "2026-12-01T07:59:00Z" })]),
      );
      expect(changes.tasks).toEqual([task("t1", { deadline: { at: DEC_4, source } })]);
      expect(changes.questions).toEqual([question("t1", { status: "answered" })]);
    }
  });

  it('does not save a date the user did not state, such as "maybe next week", and asks again', () => {
    const changes = applyDeadlineAnswers(
      [
        {
          questionIndex: 0,
          reply: "gave-date",
          date: { localDate: "2026-12-01" },
          dateKind: "external",
          statedByUser: false,
        },
      ],
      context([question("t1")]),
    );
    expect(changes.tasks).toEqual([]);
    expect(changes.questions).toEqual([]);
    expect(changes.followUps).toEqual([question("t1")]);
  });

  it("ignores answers to questions that do not exist or are already answered", () => {
    const changes = applyDeadlineAnswers(
      [
        {
          questionIndex: 3,
          reply: "gave-date",
          date: { localDate: "2026-12-04" },
          dateKind: "external",
          statedByUser: true,
        },
        {
          questionIndex: 0,
          reply: "gave-date",
          date: { localDate: "2026-12-04" },
          dateKind: "external",
          statedByUser: true,
        },
      ],
      context([question("t1", { status: "answered" })]),
    );
    expect(changes).toEqual({ tasks: [], questions: [], followUps: [] });
  });
});
