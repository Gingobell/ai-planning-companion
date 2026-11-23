import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createPostgresRepositories } from "@/data/postgres/repositories";
import { createTestDb } from "@/data/postgres/test-db";
import { ALICE, BOB, makeUser, samples } from "@/data/repository-contract";
import { scopeToUser, type ScopedRepositories } from "@/data/scoped-repositories";

// Issue #7 AC2 and AC4: two signed-in accounts, each limited to its own records.
let testDb: Awaited<ReturnType<typeof createTestDb>>;
let alice: ScopedRepositories;
let bob: ScopedRepositories;

beforeAll(async () => {
  testDb = await createTestDb();
  const repos = createPostgresRepositories(testDb.db);
  alice = scopeToUser(repos, ALICE);
  bob = scopeToUser(repos, BOB);
});

beforeEach(async () => {
  await testDb.db.execute(sql`truncate table users cascade`);
  await alice.user.save(makeUser(ALICE));
  await bob.user.save(makeUser(BOB));
});

afterAll(async () => {
  await testDb.close();
});

describe("user-scoped repositories", () => {
  it("shows each account only its own records", async () => {
    const [goal] = samples(ALICE).goals;
    await alice.goals.save(goal);
    await bob.tasks.save({ ...samples(BOB).tasks[1] });

    expect((await alice.goals.list()).map((g) => g.id)).toEqual([goal.id]);
    expect(await bob.goals.list()).toEqual([]);
    expect(await bob.goals.get(goal.id)).toBeUndefined();
    expect(await alice.tasks.list()).toEqual([]);
  });

  it("does not let one account change or delete another's record, even with its id", async () => {
    const [goal] = samples(ALICE).goals;
    await alice.goals.save(goal);

    await bob.goals.remove(goal.id);
    expect(await bob.goals.save({ ...goal, version: 1, title: "Taken over" })).toEqual({ kind: "not-found" });
    expect(await bob.goals.save({ ...goal, title: "Taken over" })).toEqual({ kind: "not-found" });
    expect(await alice.goals.get(goal.id)).toEqual({ ...goal, version: 1 });
  });

  it("stamps saved records with the signed-in user, whatever userId the caller passed", async () => {
    const [goal] = samples(ALICE).goals;
    const result = await bob.goals.save({ ...goal, id: "goal-bob", userId: ALICE });
    expect(result).toMatchObject({ kind: "saved", record: { id: "goal-bob", userId: BOB } });
    expect(await alice.goals.get("goal-bob")).toBeUndefined();
  });

  it("reads and saves only the signed-in user's settings", async () => {
    expect((await alice.user.get())?.id).toBe(ALICE);
    expect(() => bob.user.save({ ...makeUser(ALICE), version: 1 })).toThrow(/another user's settings/);
  });

  it("scopes the special queries too", async () => {
    await alice.reminders.save(samples(ALICE).reminders[1]);
    expect(await bob.reminders.listDue("2026-11-24T17:00:00Z")).toEqual([]);
    expect((await alice.reminders.listDue("2026-11-24T17:00:00Z")).length).toBe(1);
  });
});
