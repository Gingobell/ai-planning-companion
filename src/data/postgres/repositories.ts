import { and, asc, eq, gt, lt, lte, type SQL } from "drizzle-orm";
import type { PgColumn, PgDatabase, PgQueryResultHKT, PgTable } from "drizzle-orm/pg-core";
import type { Id, OwnedRecord, TimeInterval, Versioned } from "@/domain/records";
import type { DueReminderSource, Repositories, Repository, SaveResult } from "@/domain/repositories";
import * as schema from "@/data/postgres/schema";
import * as mappers from "@/data/postgres/mappers";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

// A record saved under another user's id is a programming error, not an expected outcome.
function assertOwner(userId: Id, record: OwnedRecord) {
  if (record.userId !== userId) {
    throw new Error(`Record ${record.id} belongs to another user`);
  }
}

type VersionedTable = PgTable & { id: PgColumn; version: PgColumn };
type OwnedTable = VersionedTable & { userId: PgColumn };

interface Mapper<R, TRow> {
  toRow(record: R): object;
  fromRow(row: TRow): R;
}

// Inserts a new record (version 0) or updates one whose stored version matches, then bumps the version.
// Otherwise returns the newer stored record as a conflict, or not-found when the caller has none.
async function saveVersioned<R extends Versioned, T extends VersionedTable>(
  db: Database,
  table: T,
  record: R,
  toRow: (record: R) => object,
  match: SQL | undefined,
  loadCurrent: () => Promise<R | undefined>,
): Promise<SaveResult<R>> {
  const saved = { ...record, version: record.version + 1 };
  const row = toRow(saved) as T["$inferInsert"];
  const written =
    record.version === 0
      ? await db.insert(table).values(row).onConflictDoNothing().returning({ id: table.id })
      : await db
          .update(table)
          .set(row)
          .where(and(match, eq(table.version, record.version)))
          .returning({ id: table.id });
  if (written.length > 0) return { kind: "saved", record: saved };
  const current = await loadCurrent();
  return current === undefined ? { kind: "not-found" } : { kind: "conflict", current };
}

function ownedRepository<R extends OwnedRecord, T extends OwnedTable>(
  db: Database,
  table: T,
  mapper: Mapper<R, T["$inferSelect"]>,
): Repository<R> {
  const owns = (userId: Id, id: Id) => and(eq(table.userId, userId), eq(table.id, id));
  const select = async (where: SQL | undefined) =>
    ((await db.select().from(table as PgTable).where(where)) as T["$inferSelect"][]).map((row) => mapper.fromRow(row));
  const get = async (userId: Id, id: Id) => (await select(owns(userId, id)))[0];
  return {
    list: (userId) => select(eq(table.userId, userId)),
    get,
    async save(userId, record) {
      assertOwner(userId, record);
      return saveVersioned(db, table, record, mapper.toRow, owns(userId, record.id), () => get(userId, record.id));
    },
    async remove(userId, id) {
      await db.delete(table).where(owns(userId, id));
    },
  };
}

// Intervals that only touch at an edge do not overlap, as in recommend-time-block.ts.
function overlaps(table: typeof schema.timeBlocks | typeof schema.fixedCommitments, range: TimeInterval) {
  return and(lt(table.start, range.end), gt(table.end, range.start));
}

function isDue(at: string) {
  return and(eq(schema.reminders.status, "pending"), lte(schema.reminders.scheduledFor, at));
}

// PostgreSQL implementations of the data access interfaces.
export function createPostgresRepositories(db: Database): Repositories {
  const getUser = async (userId: Id) => {
    const rows = await db.select().from(schema.users).where(eq(schema.users.id, userId));
    return rows[0] === undefined ? undefined : mappers.userMapper.fromRow(rows[0]);
  };
  return {
    users: {
      get: getUser,
      save: (user) =>
        saveVersioned(db, schema.users, user, mappers.userMapper.toRow, eq(schema.users.id, user.id), () =>
          getUser(user.id),
        ),
    },
    goals: ownedRepository(db, schema.goals, mappers.goalMapper),
    tasks: {
      ...ownedRepository(db, schema.tasks, mappers.taskMapper),
      async listByGoal(userId, goalId) {
        const { tasks } = schema;
        const rows = await db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.goalId, goalId)));
        return rows.map(mappers.taskMapper.fromRow);
      },
    },
    timeBlocks: {
      ...ownedRepository(db, schema.timeBlocks, mappers.timeBlockMapper),
      async listOverlapping(userId, range) {
        const { timeBlocks } = schema;
        const rows = await db
          .select()
          .from(timeBlocks)
          .where(and(eq(timeBlocks.userId, userId), overlaps(timeBlocks, range)))
          .orderBy(asc(timeBlocks.start));
        return rows.map(mappers.timeBlockMapper.fromRow);
      },
    },
    fixedCommitments: {
      ...ownedRepository(db, schema.fixedCommitments, mappers.fixedCommitmentMapper),
      async listOverlapping(userId, range) {
        const { fixedCommitments } = schema;
        const rows = await db
          .select()
          .from(fixedCommitments)
          .where(and(eq(fixedCommitments.userId, userId), overlaps(fixedCommitments, range)))
          .orderBy(asc(fixedCommitments.start));
        return rows.map(mappers.fixedCommitmentMapper.fromRow);
      },
    },
    preferences: ownedRepository(db, schema.preferences, mappers.preferenceMapper),
    temporaryContexts: ownedRepository(db, schema.temporaryContexts, mappers.temporaryContextMapper),
    reminders: {
      ...ownedRepository(db, schema.reminders, mappers.reminderMapper),
      async listDue(userId, at) {
        const { reminders } = schema;
        const rows = await db
          .select()
          .from(reminders)
          .where(and(eq(reminders.userId, userId), isDue(at)))
          .orderBy(asc(reminders.scheduledFor));
        return rows.map(mappers.reminderMapper.fromRow);
      },
    },
    messages: {
      ...ownedRepository(db, schema.messages, mappers.messageMapper),
      async listByChatDate(userId, chatDate) {
        const { messages } = schema;
        const rows = await db
          .select()
          .from(messages)
          .where(and(eq(messages.userId, userId), eq(messages.chatDate, chatDate)))
          .orderBy(asc(messages.createdAt));
        return rows.map(mappers.messageMapper.fromRow);
      },
    },
    openQuestions: ownedRepository(db, schema.openQuestions, mappers.openQuestionMapper),
    progressReports: ownedRepository(db, schema.progressReports, mappers.progressReportMapper),
  };
}

// Server-only: due reminders across all users, for the reminder job.
export function createPostgresDueReminderSource(db: Database): DueReminderSource {
  return {
    async listDueForAllUsers(at) {
      const rows = await db.select().from(schema.reminders).where(isDue(at)).orderBy(asc(schema.reminders.scheduledFor));
      return rows.map(mappers.reminderMapper.fromRow);
    },
  };
}
