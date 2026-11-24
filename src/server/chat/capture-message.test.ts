import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { ExtractedItem } from "@/domain/capture/plan-capture";
import type { DeadlineAnswer } from "@/domain/clarification/deadline-questions";
import { createPostgresRepositories } from "@/data/postgres/repositories";
import { createTestDb } from "@/data/postgres/test-db";
import { ALICE, BOB, makeUser } from "@/data/repository-contract";
import { scopeToUser, type ScopedRepositories } from "@/data/scoped-repositories";
import { createFakeLanguageModel } from "@/llm/fake-language-model";
import type { GenerateJsonResult } from "@/llm/language-model";
import { captureMessage, type CaptureMessageInput } from "@/server/chat/capture-message";
import { replySystemPrompt } from "@/server/chat/reply-schema";

type CaptureChoice = NonNullable<CaptureMessageInput["choice"]>;

const NOW = "2026-11-24T18:00:00Z"; // Tuesday 10:00 in Los Angeles
const TZ = "America/Los_Angeles";

let testDb: Awaited<ReturnType<typeof createTestDb>>;
let repos: ScopedRepositories;
let bobRepos: ScopedRepositories;

beforeAll(async () => {
  testDb = await createTestDb();
  repos = scopeToUser(createPostgresRepositories(testDb.db), ALICE);
  bobRepos = scopeToUser(createPostgresRepositories(testDb.db), BOB);
});

beforeEach(async () => {
  await testDb.db.execute(sql`truncate table users cascade`);
  await repos.user.save(makeUser(ALICE));
  await bobRepos.user.save(makeUser(BOB));
});

afterAll(async () => {
  await testDb.close();
});

function extracted(...items: ExtractedItem[]): GenerateJsonResult {
  return { kind: "ok", value: { items } };
}

// The reply is phrased by a second model call; when it is unavailable a template reply is used.
const NO_PHRASING: GenerateJsonResult = { kind: "unavailable" };

function capture(text: string, ...results: GenerateJsonResult[]) {
  const fake = createFakeLanguageModel(...results);
  const run = (messageId = "msg-1") =>
    captureMessage({ repos, model: fake.model, userId: ALICE, messageId, text, now: NOW, timeZone: TZ });
  return { run, requests: fake.requests };
}

const blog: ExtractedItem = { kind: "task", title: "Finish the CS6983 blog post", category: "School" };
const BLOG_ID = "msg-1:task:0";
const BLOG_QUESTION = `${BLOG_ID}:deadline`;

function withAnswers(answers: DeadlineAnswer[], ...items: ExtractedItem[]): GenerateJsonResult {
  return { kind: "ok", value: { items, answers } };
}

function phrased(reply: string, ...questions: string[]): GenerateJsonResult {
  return { kind: "ok", value: { reply, questions } };
}

// `choice` is a button press under an open question; the text is then the button's label.
function send(messageId: string, text: string, results: GenerateJsonResult[], choice?: CaptureChoice) {
  const fake = createFakeLanguageModel(...results);
  const input = { repos, model: fake.model, userId: ALICE, messageId, text, now: NOW, timeZone: TZ };
  const result = captureMessage(choice === undefined ? input : { ...input, choice });
  return { result, requests: fake.requests };
}

const lab: ExtractedItem = {
  kind: "task",
  title: "Lab 5 for CS6983",
  category: "School",
  deadline: { localDate: "2026-11-26", localTime: "23:59", statedByUser: true },
};

describe("captureMessage", () => {
  describe("C1: a mentioned goal or task is saved before anything is asked", () => {
    it("saves the user's message and the task it mentions", async () => {
      const { run } = capture("Lab 5 for CS6983 is due Thursday at 11:59 pm.", extracted(lab), NO_PHRASING);
      const result = await run();

      expect(result.kind).toBe("captured");
      const tasks = await repos.tasks.list();
      expect(tasks.map((t) => t.title)).toEqual(["Lab 5 for CS6983"]);
      const messages = await repos.messages.listByChatDate("2026-11-24");
      expect(messages[0]).toMatchObject({ role: "user", text: "Lab 5 for CS6983 is due Thursday at 11:59 pm." });
    });

    it("keeps the user's message when the model is unavailable, and saves nothing else", async () => {
      const { run } = capture("Lab 5 for CS6983 is due Thursday.", { kind: "unavailable" });
      expect(await run()).toEqual({ kind: "model-unavailable" });
      expect(await repos.tasks.list()).toEqual([]);
      expect((await repos.messages.listByChatDate("2026-11-24")).map((m) => m.role)).toEqual(["user"]);
    });

    it("stops with save-failed, without asking the model, when the message cannot be saved", async () => {
      // An id another account already uses cannot be saved for this user (PRD Section 7: success only after saving).
      await bobRepos.messages.save({
        id: "msg-1",
        userId: BOB,
        version: 0,
        chatDate: "2026-11-24",
        role: "user",
        text: "Bob's message",
        createdAt: NOW,
      });
      const { run, requests } = capture("Lab 5 for CS6983 is due Thursday.", extracted(lab));
      expect(await run()).toEqual({ kind: "save-failed" });
      expect(requests).toHaveLength(0);
      expect(await repos.tasks.list()).toEqual([]);
    });
  });

  describe("C2: goals and tasks are told apart, and a task can be linked to a goal or stand alone", () => {
    it("saves a goal, a task linked to it and a task on its own", async () => {
      const { run } = capture(
        "I want to land a summer internship, so update my resume this week. Also call the dentist.",
        extracted(
          { kind: "goal", title: "Land a summer internship", category: "Career", horizon: "long" },
          { kind: "task", title: "Update my resume", category: "Career", goalIndex: 0 },
          { kind: "task", title: "Call the dentist", category: "Health" },
        ),
        NO_PHRASING,
      );
      await run();

      const goals = await repos.goals.list();
      expect(goals.map((g) => g.title)).toEqual(["Land a summer internship"]);
      const tasks = await repos.tasks.list();
      const byTitle = Object.fromEntries(tasks.map((t) => [t.title, t]));
      expect(byTitle["Update my resume"].goalId).toBe(goals[0].id);
      expect(byTitle["Call the dentist"].goalId).toBeUndefined();
    });

    it("ignores a goal link that does not point at a goal in the same message", async () => {
      const { run } = capture(
        "Update my resume.",
        extracted({ kind: "task", title: "Update my resume", category: "Career", goalIndex: 3 }),
        NO_PHRASING,
      );
      await run();
      expect((await repos.tasks.list())[0].goalId).toBeUndefined();
    });
  });

  describe("C3: each item gets a suggested category the user can edit", () => {
    it("saves the suggested category as data, and a later edit replaces it", async () => {
      const { run } = capture(
        "I want to run a half marathon; sign up for the April race.",
        extracted(
          { kind: "goal", title: "Run a half marathon", category: "Health", horizon: "long" },
          { kind: "task", title: "Sign up for the April race", category: "Running", goalIndex: 0 },
        ),
        NO_PHRASING,
      );
      await run();

      expect((await repos.goals.list())[0].category).toBe("Health");
      const [task] = await repos.tasks.list();
      expect(task.category).toBe("Running");
      expect(await repos.tasks.save({ ...task, category: "Fitness" })).toMatchObject({ kind: "saved" });
      expect((await repos.tasks.get(task.id))?.category).toBe("Fitness");
    });
  });

  describe("C4: a deadline is saved only when the user stated one; long-term goals need none", () => {
    const task = (deadline: ExtractedItem["deadline"]): ExtractedItem => ({
      kind: "task",
      title: "Lab 5",
      category: "School",
      deadline,
    });

    async function deadlineOf(item: ExtractedItem) {
      await capture("Lab 5", extracted(item), NO_PHRASING).run();
      return (await repos.tasks.list())[0].deadline;
    }

    it("turns a stated local date and time into a UTC instant marked external", async () => {
      expect(await deadlineOf(task({ localDate: "2026-11-26", localTime: "23:59", statedByUser: true }))).toEqual({
        at: "2026-11-27T07:59:00Z",
        source: "external",
      });
    });

    it("uses the end of the stated day when no time is given", async () => {
      expect(await deadlineOf(task({ localDate: "2026-11-26", statedByUser: true }))).toEqual({
        at: "2026-11-27T07:59:00Z",
        source: "external",
      });
    });

    it("drops a deadline the model guessed", async () => {
      expect(await deadlineOf(task({ localDate: "2026-11-26", statedByUser: false }))).toBeUndefined();
    });

    it("drops a date that does not exist instead of failing", async () => {
      expect(await deadlineOf(task({ localDate: "2026-02-30", statedByUser: true }))).toBeUndefined();
    });

    it("saves a long-term goal without a deadline", async () => {
      await capture(
        "I want to get better at public speaking.",
        extracted({ kind: "goal", title: "Get better at public speaking", category: "Growth", horizon: "long" }),
        NO_PHRASING,
      ).run();
      const [goal] = await repos.goals.list();
      expect(goal).toMatchObject({ horizon: "long", status: "active" });
      expect(goal.deadline).toBeUndefined();
    });
  });

  describe("C5: retrying the same message creates no duplicates", () => {
    it("recognizes a finished capture, asks the model only once and saves each record once", async () => {
      const { run, requests } = capture(
        "Lab 5 for CS6983 is due Thursday at 11:59 pm.",
        extracted(lab),
        NO_PHRASING,
        extracted(lab),
      );
      const first = await run();
      const second = await run();

      expect(second).toEqual(first);
      expect(requests).toHaveLength(2);
      expect(await repos.tasks.list()).toHaveLength(1);
      expect((await repos.messages.listByChatDate("2026-11-24")).map((m) => m.role)).toEqual(["user", "assistant"]);
    });

    it("finishes a capture that failed at the model when the same message is sent again", async () => {
      const { run } = capture(
        "Lab 5 for CS6983 is due Thursday.",
        { kind: "unavailable" },
        extracted(lab),
        NO_PHRASING,
      );
      expect(await run()).toEqual({ kind: "model-unavailable" });
      expect((await run()).kind).toBe("captured");
      expect(await repos.tasks.list()).toHaveLength(1);
      expect((await repos.messages.listByChatDate("2026-11-24")).map((m) => m.role)).toEqual(["user", "assistant"]);
    });
  });

  describe("Q4: each question asked is saved as an open question, and answers in later messages count", () => {
    it("asks for the deadline of a new task, saves the question and replies with the phrased text", async () => {
      const { result } = send("msg-1", "Finish the CS6983 blog post", [
        extracted(blog),
        phrased("Saved it. When is the blog post due?", "When is the blog post due?"),
      ]);
      expect(await result).toMatchObject({ kind: "captured", reply: "Saved it. When is the blog post due?" });
      expect(await repos.openQuestions.list()).toEqual([
        {
          id: `${BLOG_ID}:deadline`,
          userId: ALICE,
          version: 1,
          taskId: BLOG_ID,
          topic: "deadline",
          question: "When is the blog post due?",
          status: "open",
          askedIn: "msg-1:reply",
        },
      ]);
    });

    it("asks nothing about goals or tasks whose deadline the user stated", async () => {
      const { result, requests } = send("msg-1", "Lab 5 is due Thursday; I want to land an internship.", [
        extracted(lab, { kind: "goal", title: "Land an internship", category: "Career", horizon: "long" }),
        phrased("Saved both."),
      ]);
      await result;
      expect(await repos.openQuestions.list()).toEqual([]);
      expect(requests[1].prompt).toContain('"questions":[]');
    });

    it("uses a template question when the reply cannot be phrased", async () => {
      const { result } = send("msg-1", "Finish the CS6983 blog post", [extracted(blog), NO_PHRASING]);
      const captured = await result;
      expect(captured.kind === "captured" && captured.reply).toContain('When is "Finish the CS6983 blog post" due?');
      const [question] = await repos.openQuestions.list();
      expect(question.question).toContain('When is "Finish the CS6983 blog post" due?');
    });

    it("does not save a second question when a capture that stopped before its reply is sent again", async () => {
      // Bob owning the reply's id makes the first reply save fail after the question was saved.
      await bobRepos.messages.save({
        id: "msg-1:reply",
        userId: BOB,
        version: 0,
        chatDate: "2026-11-24",
        role: "assistant",
        text: "Bob's reply",
        createdAt: NOW,
      });
      expect(await send("msg-1", "Finish the blog post", [extracted(blog), NO_PHRASING]).result).toEqual({
        kind: "save-failed",
      });
      await bobRepos.messages.remove("msg-1:reply");

      const retry = send("msg-1", "Finish the blog post", [extracted(blog), NO_PHRASING]);
      const captured = await retry.result;
      expect(captured.kind === "captured" && captured.reply).toContain("When is");
      expect(await repos.openQuestions.list()).toHaveLength(1);
    });

    it("keeps an unanswered question open and does not ask it again with every message", async () => {
      await send("msg-1", "Finish the blog post", [extracted(blog), NO_PHRASING]).result;
      const later = send("msg-2", "Call the dentist tomorrow", [
        extracted({ kind: "task", title: "Call the dentist", category: "Health" }),
        phrased("Saved. When should you call?", "When should you call the dentist?"),
      ]);
      await later.result;

      expect(later.requests[0].prompt).toContain("Finish the CS6983 blog post");
      expect(later.requests[1].prompt).not.toContain("Finish the CS6983 blog post");
      const questions = await repos.openQuestions.list();
      expect(questions.map((q) => [q.taskId, q.status]).sort()).toEqual([
        [BLOG_ID, "open"],
        ["msg-2:task:0", "open"],
      ]);
    });

    it("suggests a target date when there is no deadline, and saves it as agreed once the user says yes", async () => {
      await send("msg-1", "Finish the blog post", [extracted(blog), NO_PHRASING]).result;
      const noDeadline = send("msg-2", "There is no fixed date", [
        withAnswers([{ questionIndex: 0, reply: "no-deadline", suggestedTarget: { localDate: "2026-12-04" } }]),
        phrased("How about Friday, Dec 4?", "How about Friday, Dec 4?"),
      ]);
      await noDeadline.result;
      expect(noDeadline.requests[1].prompt).toContain("Dec 4");
      expect((await repos.tasks.get(BLOG_ID))?.deadline).toBeUndefined();

      await send("msg-3", "Yes", [withAnswers([{ questionIndex: 0, reply: "agrees" }]), NO_PHRASING]).result;
      expect((await repos.tasks.get(BLOG_ID))?.deadline).toEqual({ at: "2026-12-05T07:59:00Z", source: "agreed" });
      expect((await repos.openQuestions.get(`${BLOG_ID}:deadline`))?.status).toBe("answered");
    });
  });

  describe("Q5: a button answers an open question in one step, and a closed question ignores it", () => {
    async function withSuggestedTarget() {
      await send("msg-1", "Finish the blog post", [extracted(blog), NO_PHRASING]).result;
      await send("msg-2", "There is no fixed date", [
        withAnswers([{ questionIndex: 0, reply: "no-deadline", suggestedTarget: { localDate: "2026-12-04" } }]),
        NO_PHRASING,
      ]).result;
    }

    it("shows a follow-up under the reply that asked it last", async () => {
      await withSuggestedTarget();
      expect((await repos.openQuestions.get(BLOG_QUESTION))?.askedIn).toBe("msg-2:reply");
    });

    it("saves the suggested target as agreed when Accept is pressed, without asking the model to read it", async () => {
      await withSuggestedTarget();
      const accept = send("msg-3", "Accept Fri, Dec 4", [NO_PHRASING], { questionId: BLOG_QUESTION, reply: "agrees" });
      expect((await accept.result).kind).toBe("captured");

      expect(accept.requests.map((request) => request.system)).toEqual([replySystemPrompt()]);
      expect((await repos.tasks.get(BLOG_ID))?.deadline).toEqual({ at: "2026-12-05T07:59:00Z", source: "agreed" });
      expect((await repos.openQuestions.get(BLOG_QUESTION))?.status).toBe("answered");
      const texts = (await repos.messages.listByChatDate("2026-11-24")).map((message) => message.text);
      expect(texts).toContain("Accept Fri, Dec 4");
    });

    it("clears the suggestion when Another time is pressed and asks for the user's own date", async () => {
      await withSuggestedTarget();
      const another = send("msg-3", "Another time", [NO_PHRASING], { questionId: BLOG_QUESTION, reply: "declines" });
      const result = await another.result;

      expect(result.kind === "captured" && result.reply).toContain('When is "Finish the CS6983 blog post" due?');
      const question = await repos.openQuestions.get(BLOG_QUESTION);
      expect(question).toMatchObject({ status: "open", askedIn: "msg-3:reply" });
      expect(question?.proposedDeadline).toBeUndefined();
      expect((await repos.tasks.get(BLOG_ID))?.deadline).toBeUndefined();
    });

    it("changes nothing when a button is pressed on a question that is no longer open", async () => {
      await withSuggestedTarget();
      await send("msg-3", "Accept", [NO_PHRASING], { questionId: BLOG_QUESTION, reply: "agrees" }).result;
      const late = send("msg-4", "Accept", [], { questionId: BLOG_QUESTION, reply: "agrees" });

      expect(await late.result).toEqual({ kind: "question-closed" });
      expect(late.requests).toHaveLength(0);
      expect((await repos.messages.listByChatDate("2026-11-24")).map((message) => message.id)).not.toContain("msg-4");
    });
  });
});
