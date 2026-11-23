import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Id, OwnedRecord, User } from "@/domain/records";
import type { DueReminderSource, Repositories, Repository } from "@/domain/repositories";

// One test suite for every implementation of the data access interfaces
// (PostgreSQL here; the in-memory version runs the same suite).

export interface RepositoryHarness {
  repos: Repositories;
  dueReminders: DueReminderSource;
  reset(): Promise<void>;
  close(): Promise<void>;
}

export const ALICE = "user-alice";
export const BOB = "user-bob";

export function makeUser(id: Id): User {
  return {
    id,
    version: 0,
    timeZone: "America/Los_Angeles",
    availability: { 1: [{ start: "09:00", end: "17:00" }], 6: [] },
    checkInTimes: ["09:00", "21:00"],
    quietHours: { start: "22:00", end: "07:00" },
    remindersPause: { until: "2026-12-01T08:00:00Z" },
  };
}

// For each repository: a record with every optional field set and one with none.
export function samples(userId: Id) {
  const base = (id: Id) => ({ id, userId, version: 0 });
  return {
    goals: [
      {
        ...base("goal-full"),
        title: "Land a summer internship",
        category: "Career",
        horizon: "long" as const,
        deadline: { at: "2027-03-01T08:00:00Z", source: "external" as const },
        status: "active" as const,
      },
      { ...base("goal-min"), title: "Read more", category: "Personal", horizon: "long" as const, status: "active" as const },
    ],
    tasks: [
      {
        ...base("task-full"),
        title: "Finish lab 5",
        category: "School",
        goalId: "goal-full",
        parentTaskId: "task-parent",
        deadline: { at: "2026-11-27T07:59:00Z", source: "agreed" as const },
        priority: "high" as const,
        estimatedMinutes: 90,
        estimateSource: "assistant" as const,
        status: "in-progress" as const,
        remindersEnabled: true,
        acceptance: "accepted" as const,
      },
      {
        ...base("task-min"),
        title: "Call the dentist",
        category: "Personal",
        priority: "low" as const,
        status: "not-started" as const,
        remindersEnabled: false,
        acceptance: "proposed" as const,
      },
    ],
    timeBlocks: [
      { ...base("block-1"), taskId: "task-full", start: "2026-11-24T17:00:00Z", end: "2026-11-24T18:30:00Z", status: "proposed" as const },
    ],
    fixedCommitments: [
      { ...base("commitment-full"), title: "CS6983 lecture", start: "2026-11-24T21:00:00Z", end: "2026-11-24T23:00:00Z" },
      { ...base("commitment-min"), start: "2026-11-25T16:00:00Z", end: "2026-11-25T17:00:00Z" },
    ],
    preferences: [
      {
        ...base("pref-full"),
        description: "Interview practice in the evening",
        scope: "interview practice",
        preferredWindow: { start: "19:00", end: "21:00" },
        status: "corrected" as const,
        source: "user-stated" as const,
        supersededBy: "pref-min",
      },
      { ...base("pref-min"), description: "No meetings before 10", scope: "all", status: "tentative" as const, source: "confirmed-inference" as const },
    ],
    temporaryContexts: [
      { ...base("context-1"), description: "Low energy today", startsAt: "2026-11-24T08:00:00Z", endsAt: "2026-11-25T08:00:00Z" },
    ],
    reminders: [
      {
        ...base("reminder-full"),
        kind: "task" as const,
        taskId: "task-full",
        timeBlockId: "block-1",
        scheduledFor: "2026-11-24T16:45:00Z",
        status: "delivered" as const,
        deliveryKey: `${userId}:block-1:start`,
        answeredAt: "2026-11-24T16:50:00Z",
      },
      { ...base("reminder-min"), kind: "check-in" as const, scheduledFor: "2026-11-24T17:00:00Z", status: "pending" as const, deliveryKey: `${userId}:check-in:2026-11-24` },
    ],
    messages: [
      { ...base("message-1"), chatDate: "2026-11-24", role: "user" as const, text: "Lab 5 is due Thursday", createdAt: "2026-11-24T18:02:11Z" },
    ],
    openQuestions: [
      { ...base("question-full"), taskId: "task-full", question: "When is lab 5 due?", status: "open" as const },
      { ...base("question-min"), question: "Which evenings are free?", status: "answered" as const },
    ],
    progressReports: [
      { ...base("progress-1"), taskId: "task-full", kind: "partial" as const, note: "Part 1 done", reportedAt: "2026-11-24T19:00:00Z" },
    ],
  };
}

type OwnedRepoName = keyof ReturnType<typeof samples>;
const ownedRepoNames = Object.keys(samples(ALICE)) as OwnedRepoName[];

function repo(repos: Repositories, name: OwnedRepoName) {
  return repos[name] as unknown as Repository<OwnedRecord>;
}

export function describeRepositoryContract(name: string, createHarness: () => Promise<RepositoryHarness>) {
  describe(`${name} repositories`, () => {
    let h: RepositoryHarness;

    beforeAll(async () => {
      h = await createHarness();
    });
    beforeEach(async () => {
      await h.reset();
      await h.repos.users.save(makeUser(ALICE));
      await h.repos.users.save(makeUser(BOB));
    });
    afterAll(async () => {
      await h.close();
    });

    describe("round trip", () => {
      it("saves a new user as version 1 and reads it back unchanged", async () => {
        const user: User = { id: "user-carol", version: 0, timeZone: "Asia/Shanghai", availability: {}, checkInTimes: [] };
        const result = await h.repos.users.save(user);
        expect(result).toEqual({ kind: "saved", record: { ...user, version: 1 } });
        expect(await h.repos.users.get("user-carol")).toEqual({ ...user, version: 1 });
        expect(await h.repos.users.get(ALICE)).toEqual({ ...makeUser(ALICE), version: 1 });
      });

      it.each(ownedRepoNames)("saves each %s sample as version 1 and reads it back unchanged", async (repoName) => {
        for (const record of samples(ALICE)[repoName]) {
          const result = await repo(h.repos, repoName).save(ALICE, record);
          expect(result).toEqual({ kind: "saved", record: { ...record, version: 1 } });
          expect(await repo(h.repos, repoName).get(ALICE, record.id)).toEqual({ ...record, version: 1 });
        }
      });
    });

    describe("versions", () => {
      it("updates a record when its version matches and increments the version", async () => {
        const [goal] = samples(ALICE).goals;
        await h.repos.goals.save(ALICE, goal);
        const edited = { ...goal, version: 1, title: "Land a fall internship" };
        expect(await h.repos.goals.save(ALICE, edited)).toEqual({ kind: "saved", record: { ...edited, version: 2 } });
        expect(await h.repos.goals.get(ALICE, goal.id)).toEqual({ ...edited, version: 2 });
      });

      it("returns the newer stored record instead of overwriting it with a stale edit", async () => {
        const [goal] = samples(ALICE).goals;
        await h.repos.goals.save(ALICE, goal);
        await h.repos.goals.save(ALICE, { ...goal, version: 1, title: "Newer edit" });
        const stale = { ...goal, version: 1, title: "Stale edit" };
        const current = { ...goal, version: 2, title: "Newer edit" };
        expect(await h.repos.goals.save(ALICE, stale)).toEqual({ kind: "conflict", current });
        expect(await h.repos.goals.save(ALICE, { ...goal, version: 0 })).toEqual({ kind: "conflict", current });
        expect(await h.repos.goals.get(ALICE, goal.id)).toEqual(current);
      });

      it("returns not-found when the record was deleted before the edit", async () => {
        const [goal] = samples(ALICE).goals;
        await h.repos.goals.save(ALICE, goal);
        await h.repos.goals.remove(ALICE, goal.id);
        expect(await h.repos.goals.save(ALICE, { ...goal, version: 1 })).toEqual({ kind: "not-found" });
        expect(await h.repos.goals.get(ALICE, goal.id)).toBeUndefined();
      });

      it("applies the same version rules to users", async () => {
        const alice = { ...makeUser(ALICE), version: 1, timeZone: "America/New_York" };
        expect(await h.repos.users.save(alice)).toEqual({ kind: "saved", record: { ...alice, version: 2 } });
        const stale = { ...makeUser(ALICE), version: 1 };
        expect(await h.repos.users.save(stale)).toEqual({ kind: "conflict", current: { ...alice, version: 2 } });
        expect(await h.repos.users.save({ ...makeUser("user-gone"), version: 3 })).toEqual({ kind: "not-found" });
      });
    });

    describe("ownership", () => {
      it.each(ownedRepoNames)("keeps each user's %s to that user for list, get and remove", async (repoName) => {
        const [aliceRecord] = samples(ALICE)[repoName];
        const bobRecord = { ...samples(BOB)[repoName][0], id: `${aliceRecord.id}-bob` };
        await repo(h.repos, repoName).save(ALICE, aliceRecord);
        await repo(h.repos, repoName).save(BOB, bobRecord);

        expect((await repo(h.repos, repoName).list(ALICE)).map((r) => r.id)).toEqual([aliceRecord.id]);
        expect(await repo(h.repos, repoName).get(BOB, aliceRecord.id)).toBeUndefined();

        await repo(h.repos, repoName).remove(BOB, aliceRecord.id);
        expect(await repo(h.repos, repoName).get(ALICE, aliceRecord.id)).toBeDefined();

        await repo(h.repos, repoName).remove(ALICE, aliceRecord.id);
        expect(await repo(h.repos, repoName).get(ALICE, aliceRecord.id)).toBeUndefined();
        expect(await repo(h.repos, repoName).get(BOB, bobRecord.id)).toBeDefined();
      });

      it("returns not-found when another user saves over an existing id, and leaves the record alone", async () => {
        const [aliceGoal] = samples(ALICE).goals;
        await h.repos.goals.save(ALICE, aliceGoal);
        const intruder = { ...aliceGoal, userId: BOB, title: "Taken over" };
        expect(await h.repos.goals.save(BOB, intruder)).toEqual({ kind: "not-found" });
        expect(await h.repos.goals.save(BOB, { ...intruder, version: 1 })).toEqual({ kind: "not-found" });
        expect(await h.repos.goals.get(ALICE, aliceGoal.id)).toEqual({ ...aliceGoal, version: 1 });
      });

      it("rejects saving a record whose userId is not the caller's", async () => {
        const [goal] = samples(BOB).goals;
        await expect(h.repos.goals.save(ALICE, goal)).rejects.toThrow(/belongs to another user/);
        expect(await h.repos.goals.get(BOB, goal.id)).toBeUndefined();
      });
    });
  });
}
