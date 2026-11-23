import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { DueReminderSource, Repositories } from "@/domain/repositories";
import type * as schema from "@/data/postgres/schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

function notImplemented(): never {
  throw new Error("not implemented");
}

const stub = { list: notImplemented, get: notImplemented, save: notImplemented, remove: notImplemented };

// PostgreSQL implementations of the data access interfaces.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub until the repositories are built
export function createPostgresRepositories(db: Database): Repositories {
  return {
    users: { get: notImplemented, save: notImplemented },
    goals: stub,
    tasks: { ...stub, listByGoal: notImplemented },
    timeBlocks: { ...stub, listOverlapping: notImplemented },
    fixedCommitments: { ...stub, listOverlapping: notImplemented },
    preferences: stub,
    temporaryContexts: stub,
    reminders: { ...stub, listDue: notImplemented },
    messages: { ...stub, listByChatDate: notImplemented },
    openQuestions: stub,
    progressReports: stub,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub until the query is built
export function createPostgresDueReminderSource(db: Database): DueReminderSource {
  return { listDueForAllUsers: notImplemented };
}
