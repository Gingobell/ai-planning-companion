import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { ExtractedItem } from "@/domain/capture/plan-capture";
import { createPostgresRepositories } from "@/data/postgres/repositories";
import { createTestDb } from "@/data/postgres/test-db";
import { ALICE, makeUser } from "@/data/repository-contract";
import { scopeToUser, type ScopedRepositories } from "@/data/scoped-repositories";
import { createFakeLanguageModel } from "@/llm/fake-language-model";
import type { GenerateJsonResult } from "@/llm/language-model";
import { captureMessage } from "@/server/chat/capture-message";

const NOW = "2026-11-24T18:00:00Z"; // Tuesday 10:00 in Los Angeles
const TZ = "America/Los_Angeles";

let testDb: Awaited<ReturnType<typeof createTestDb>>;
let repos: ScopedRepositories;

beforeAll(async () => {
  testDb = await createTestDb();
  repos = scopeToUser(createPostgresRepositories(testDb.db), ALICE);
});

beforeEach(async () => {
  await testDb.db.execute(sql`truncate table users cascade`);
  await repos.user.save(makeUser(ALICE));
});

afterAll(async () => {
  await testDb.close();
});

function extracted(...items: ExtractedItem[]): GenerateJsonResult {
  return { kind: "ok", value: { items } };
}

function capture(text: string, ...results: GenerateJsonResult[]) {
  const fake = createFakeLanguageModel(...results);
  const run = (messageId = "msg-1") =>
    captureMessage({ repos, model: fake.model, userId: ALICE, messageId, text, now: NOW, timeZone: TZ });
  return { run, requests: fake.requests };
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
      const { run } = capture("Lab 5 for CS6983 is due Thursday at 11:59 pm.", extracted(lab));
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
      await capture("Lab 5", extracted(item)).run();
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
      ).run();
      const [goal] = await repos.goals.list();
      expect(goal).toMatchObject({ horizon: "long", status: "active" });
      expect(goal.deadline).toBeUndefined();
    });
  });
});
