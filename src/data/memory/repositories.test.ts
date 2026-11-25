import { describe, expect, it } from "vitest";
import { describeRepositoryContract, makeUser, samples, ALICE } from "@/data/repository-contract";
import { createMemoryStore } from "@/data/memory/repositories";

describeRepositoryContract("in-memory", async () => {
  const store = createMemoryStore();
  return {
    repos: store.repos,
    dueReminders: store.dueReminders,
    reset: async () => store.clear(),
    close: async () => {},
  };
});

describe("in-memory repositories beyond the contract", () => {
  it("returns copies, so changing a returned record does not change the stored one", async () => {
    const { repos } = createMemoryStore();
    await repos.users.save(makeUser(ALICE));
    const [goal] = samples(ALICE).goals;
    await repos.goals.save(ALICE, goal);

    const read = await repos.goals.get(ALICE, goal.id);
    if (read === undefined) throw new Error("goal was not saved");
    read.title = "Changed outside the store";

    expect((await repos.goals.get(ALICE, goal.id))?.title).toBe(goal.title);
  });

  it("does not create a second reminder with a delivery key the user already has", async () => {
    const { repos } = createMemoryStore();
    const [, checkIn] = samples(ALICE).reminders;
    await repos.reminders.save(ALICE, checkIn);
    expect(await repos.reminders.save(ALICE, { ...checkIn, id: "duplicate" })).toEqual({ kind: "not-found" });
    expect((await repos.reminders.list(ALICE)).map((r) => r.id)).toEqual([checkIn.id]);
  });
});
