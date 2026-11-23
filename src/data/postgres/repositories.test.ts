import { sql } from "drizzle-orm";
import { describeRepositoryContract } from "@/data/repository-contract";
import { createPostgresDueReminderSource, createPostgresRepositories } from "@/data/postgres/repositories";
import { createTestDb } from "@/data/postgres/test-db";

describeRepositoryContract("PostgreSQL", async () => {
  const { db, close } = await createTestDb();
  return {
    repos: createPostgresRepositories(db),
    dueReminders: createPostgresDueReminderSource(db),
    // Deleting users cascades to every owned table.
    reset: async () => {
      await db.execute(sql`truncate table users cascade`);
    },
    close,
  };
});
