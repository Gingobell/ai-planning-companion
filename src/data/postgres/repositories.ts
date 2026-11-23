import { and, eq } from "drizzle-orm";
import type { PgColumn, PgDatabase, PgQueryResultHKT, PgTable } from "drizzle-orm/pg-core";
import type { Id, OwnedRecord, User } from "@/domain/records";
import type { DueReminderSource, Repositories, Repository, SaveResult } from "@/domain/repositories";
import * as schema from "@/data/postgres/schema";
import * as mappers from "@/data/postgres/mappers";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

function notImplemented(): never {
  throw new Error("not implemented");
}

// A record saved under another user's id is a programming error, not an expected outcome.
function assertOwner(userId: Id, record: OwnedRecord) {
  if (record.userId !== userId) {
    throw new Error(`Record ${record.id} belongs to another user`);
  }
}

type OwnedTable = PgTable & { id: PgColumn; userId: PgColumn; version: PgColumn };

interface Mapper<R, TRow> {
  toRow(record: R): object;
  fromRow(row: TRow): R;
}

function ownedRepository<R extends OwnedRecord, T extends OwnedTable>(
  db: Database,
  table: T,
  mapper: Mapper<R, T["$inferSelect"]>,
): Repository<R> {
  const owns = (userId: Id, id: Id) => and(eq(table.userId, userId), eq(table.id, id));
  return {
    async list(userId) {
      const rows = (await db.select().from(table as PgTable).where(eq(table.userId, userId))) as T["$inferSelect"][];
      return rows.map((row) => mapper.fromRow(row));
    },
    async get(userId, id) {
      const rows = (await db.select().from(table as PgTable).where(owns(userId, id))) as T["$inferSelect"][];
      return rows[0] === undefined ? undefined : mapper.fromRow(rows[0]);
    },
    async save(userId, record): Promise<SaveResult<R>> {
      assertOwner(userId, record);
      const saved = { ...record, version: record.version + 1 };
      const row = mapper.toRow(saved) as T["$inferInsert"];
      const written =
        record.version === 0
          ? await db.insert(table).values(row).onConflictDoNothing().returning({ id: table.id })
          : await db
              .update(table)
              .set(row)
              .where(and(owns(userId, record.id), eq(table.version, record.version)))
              .returning({ id: table.id });
      if (written.length > 0) return { kind: "saved", record: saved };
      const current = await this.get(userId, record.id);
      return current === undefined ? { kind: "not-found" } : { kind: "conflict", current };
    },
    async remove(userId, id) {
      await db.delete(table).where(owns(userId, id));
    },
  };
}

// PostgreSQL implementations of the data access interfaces.
export function createPostgresRepositories(db: Database): Repositories {
  return {
    users: {
      async get(userId) {
        const rows = await db.select().from(schema.users).where(eq(schema.users.id, userId));
        return rows[0] === undefined ? undefined : mappers.userMapper.fromRow(rows[0]);
      },
      async save(user): Promise<SaveResult<User>> {
        const saved = { ...user, version: user.version + 1 };
        const row = mappers.userMapper.toRow(saved);
        const { users } = schema;
        const written =
          user.version === 0
            ? await db.insert(users).values(row).onConflictDoNothing().returning({ id: users.id })
            : await db
                .update(users)
                .set(row)
                .where(and(eq(users.id, user.id), eq(users.version, user.version)))
                .returning({ id: users.id });
        if (written.length > 0) return { kind: "saved", record: saved };
        const current = await this.get(user.id);
        return current === undefined ? { kind: "not-found" } : { kind: "conflict", current };
      },
    },
    goals: ownedRepository(db, schema.goals, mappers.goalMapper),
    tasks: { ...ownedRepository(db, schema.tasks, mappers.taskMapper), listByGoal: notImplemented },
    timeBlocks: { ...ownedRepository(db, schema.timeBlocks, mappers.timeBlockMapper), listOverlapping: notImplemented },
    fixedCommitments: {
      ...ownedRepository(db, schema.fixedCommitments, mappers.fixedCommitmentMapper),
      listOverlapping: notImplemented,
    },
    preferences: ownedRepository(db, schema.preferences, mappers.preferenceMapper),
    temporaryContexts: ownedRepository(db, schema.temporaryContexts, mappers.temporaryContextMapper),
    reminders: { ...ownedRepository(db, schema.reminders, mappers.reminderMapper), listDue: notImplemented },
    messages: { ...ownedRepository(db, schema.messages, mappers.messageMapper), listByChatDate: notImplemented },
    openQuestions: ownedRepository(db, schema.openQuestions, mappers.openQuestionMapper),
    progressReports: ownedRepository(db, schema.progressReports, mappers.progressReportMapper),
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub until the query is built
export function createPostgresDueReminderSource(db: Database): DueReminderSource {
  return { listDueForAllUsers: notImplemented };
}
