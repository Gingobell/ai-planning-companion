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
});
