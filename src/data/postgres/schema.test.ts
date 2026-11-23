import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb } from "@/data/postgres/test-db";

const ownedTables = [
  "goals",
  "tasks",
  "time_blocks",
  "fixed_commitments",
  "preferences",
  "temporary_contexts",
  "reminders",
  "messages",
  "open_questions",
  "progress_reports",
];

let testDb: Awaited<ReturnType<typeof createTestDb>>;

beforeAll(async () => {
  testDb = await createTestDb();
});

afterAll(async () => {
  await testDb.close();
});

async function columnsOf(table: string) {
  const { rows } = await testDb.client.query<{ column_name: string; is_nullable: string }>(
    "select column_name, is_nullable from information_schema.columns where table_schema = 'public' and table_name = $1",
    [table],
  );
  return new Map(rows.map((row) => [row.column_name, row.is_nullable]));
}

describe("database schema", () => {
  it("has a users table with a version column", async () => {
    const columns = await columnsOf("users");
    expect(columns.get("id")).toBe("NO");
    expect(columns.get("version")).toBe("NO");
  });

  it.each(ownedTables)("has an owned table %s with a non-null user_id and a version", async (table) => {
    const columns = await columnsOf(table);
    expect(columns.get("user_id")).toBe("NO");
    expect(columns.get("version")).toBe("NO");
  });
});
