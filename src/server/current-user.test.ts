import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createPostgresRepositories } from "@/data/postgres/repositories";
import { createTestDb } from "@/data/postgres/test-db";
import { ensureUserSettings, resolveCurrentUser } from "@/server/current-user";

let testDb: Awaited<ReturnType<typeof createTestDb>>;
let repos: ReturnType<typeof createPostgresRepositories>;

beforeAll(async () => {
  testDb = await createTestDb();
  repos = createPostgresRepositories(testDb.db);
});

beforeEach(async () => {
  await testDb.db.execute(sql`truncate table users cascade`);
});

afterAll(async () => {
  await testDb.close();
});

const signedIn = (id: string) => async () => ({ id, email: `${id}@example.com` });
const signedOut = async () => undefined;

describe("current user", () => {
  it("returns nothing when no one is signed in", async () => {
    expect(await resolveCurrentUser(signedOut, repos)).toBeUndefined();
  });

  it("returns repositories bound to the signed-in user", async () => {
    const current = await resolveCurrentUser(signedIn("user-1"), repos);
    expect(current?.id).toBe("user-1");
    await ensureUserSettings(current!.repos, "user-1", "America/Los_Angeles"); // defined: signed in above
    expect((await current!.repos.user.get())?.id).toBe("user-1");
  });

  it("creates settings on first sign-in with the browser's time zone and nothing guessed", async () => {
    const current = (await resolveCurrentUser(signedIn("user-1"), repos))!; // signed in
    const user = await ensureUserSettings(current.repos, "user-1", "Asia/Shanghai");
    expect(user).toEqual({ id: "user-1", version: 1, timeZone: "Asia/Shanghai", availability: {}, checkInTimes: [] });
  });

  it("keeps existing settings on later sign-ins", async () => {
    const current = (await resolveCurrentUser(signedIn("user-1"), repos))!; // signed in
    await ensureUserSettings(current.repos, "user-1", "Asia/Shanghai");
    const again = await ensureUserSettings(current.repos, "user-1", "Europe/London");
    expect(again.timeZone).toBe("Asia/Shanghai");
  });

  it("rejects a time zone that is not a real IANA zone", async () => {
    const current = (await resolveCurrentUser(signedIn("user-1"), repos))!; // signed in
    await expect(ensureUserSettings(current.repos, "user-1", "Mars/Olympus")).rejects.toThrow(/Unknown time zone/);
  });
});
