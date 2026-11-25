import { Temporal } from "temporal-polyfill";
import type {
  FixedCommitment,
  Goal,
  Id,
  Message,
  OpenQuestion,
  OwnedRecord,
  Preference,
  ProgressReport,
  Reminder,
  Task,
  TemporaryContext,
  TimeBlock,
  TimeInterval,
  User,
  Versioned,
} from "@/domain/records";
import type { DueReminderSource, Repositories, Repository, SaveResult } from "@/domain/repositories";

// In-memory implementations of the data access interfaces, for tests and local work without a database.
// They follow the same rules as the PostgreSQL repositories, checked by the shared contract suite:
// ids are unique per table across users, every call is scoped to its user, and saves are versioned.

type Table<R> = Map<Id, R>;

// Callers get copies, so changing a returned record never changes what is stored.
const copy = <R>(record: R): R => structuredClone(record);

const byInstant =
  <R>(instantOf: (record: R) => string) =>
  (a: R, b: R) =>
    Temporal.Instant.compare(Temporal.Instant.from(instantOf(a)), Temporal.Instant.from(instantOf(b)));

const isBefore = (a: string, b: string) =>
  Temporal.Instant.compare(Temporal.Instant.from(a), Temporal.Instant.from(b)) < 0;

// Touching edges do not overlap, as in the PostgreSQL repositories and recommend-time-block.ts.
const overlaps = (interval: TimeInterval, range: TimeInterval) =>
  isBefore(interval.start, range.end) && isBefore(range.start, interval.end);

// Inserts a new record (version 0) or updates one whose stored version matches, then bumps the version.
// `stored` is the record with this id that the caller may see; `taken` says the id or a unique key
// already belongs to a record the caller may not see, which reads as not-found.
function saveVersioned<R extends Versioned & { id: Id }>(
  table: Table<R>,
  record: R,
  stored: R | undefined,
  taken: boolean,
): SaveResult<R> {
  const matches = stored === undefined ? record.version === 0 && !taken : stored.version === record.version;
  if (matches) {
    const saved = { ...record, version: record.version + 1 };
    table.set(record.id, copy(saved));
    return { kind: "saved", record: copy(saved) };
  }
  return stored === undefined ? { kind: "not-found" } : { kind: "conflict", current: copy(stored) };
}

function ownedRepository<R extends OwnedRecord>(
  table: Table<R>,
  uniqueKeyTaken: (userId: Id, record: R) => boolean = () => false,
): Repository<R> {
  const visible = (userId: Id, id: Id) => {
    const record = table.get(id);
    return record?.userId === userId ? record : undefined;
  };
  return {
    async list(userId) {
      return [...table.values()].filter((record) => record.userId === userId).map(copy);
    },
    async get(userId, id) {
      const record = visible(userId, id);
      return record === undefined ? undefined : copy(record);
    },
    async save(userId, record) {
      // A record saved under another user's id is a programming error, not an expected outcome.
      if (record.userId !== userId) throw new Error(`Record ${record.id} belongs to another user`);
      const stored = visible(userId, record.id);
      const taken = table.has(record.id) || uniqueKeyTaken(userId, record);
      return saveVersioned(table, record, stored, taken);
    },
    async remove(userId, id) {
      if (visible(userId, id) !== undefined) table.delete(id);
    },
  };
}

export interface MemoryStore {
  repos: Repositories;
  dueReminders: DueReminderSource;
  // Empties every table.
  clear(): void;
}

export function createMemoryStore(): MemoryStore {
  const users: Table<User> = new Map();
  const tables = {
    goals: new Map<Id, Goal>(),
    tasks: new Map<Id, Task>(),
    timeBlocks: new Map<Id, TimeBlock>(),
    fixedCommitments: new Map<Id, FixedCommitment>(),
    preferences: new Map<Id, Preference>(),
    temporaryContexts: new Map<Id, TemporaryContext>(),
    reminders: new Map<Id, Reminder>(),
    messages: new Map<Id, Message>(),
    openQuestions: new Map<Id, OpenQuestion>(),
    progressReports: new Map<Id, ProgressReport>(),
  };

  const isDue = (reminder: Reminder, at: string) =>
    reminder.status === "pending" && !isBefore(at, reminder.scheduledFor);

  // A delivery key identifies a reminder within one user, matching the (user_id, delivery_key) index.
  const reminderKeyTaken = (userId: Id, reminder: Reminder) =>
    [...tables.reminders.values()].some(
      (other) => other.userId === userId && other.deliveryKey === reminder.deliveryKey && other.id !== reminder.id,
    );

  const tasks = ownedRepository(tables.tasks);
  const timeBlocks = ownedRepository(tables.timeBlocks);
  const fixedCommitments = ownedRepository(tables.fixedCommitments);
  const reminders = ownedRepository(tables.reminders, reminderKeyTaken);
  const messages = ownedRepository(tables.messages);

  const repos: Repositories = {
    users: {
      async get(userId) {
        const user = users.get(userId);
        return user === undefined ? undefined : copy(user);
      },
      async save(user) {
        return saveVersioned(users, user, users.get(user.id), false);
      },
    },
    goals: ownedRepository(tables.goals),
    tasks: {
      ...tasks,
      async listByGoal(userId, goalId) {
        return (await tasks.list(userId)).filter((task) => task.goalId === goalId);
      },
    },
    timeBlocks: {
      ...timeBlocks,
      async listOverlapping(userId, range) {
        const blocks = await timeBlocks.list(userId);
        return blocks.filter((block) => overlaps(block, range)).sort(byInstant((block) => block.start));
      },
    },
    fixedCommitments: {
      ...fixedCommitments,
      async listOverlapping(userId, range) {
        const commitments = await fixedCommitments.list(userId);
        return commitments.filter((c) => overlaps(c, range)).sort(byInstant((c) => c.start));
      },
    },
    preferences: ownedRepository(tables.preferences),
    temporaryContexts: ownedRepository(tables.temporaryContexts),
    reminders: {
      ...reminders,
      async listDue(userId, at) {
        const own = await reminders.list(userId);
        return own.filter((reminder) => isDue(reminder, at)).sort(byInstant((reminder) => reminder.scheduledFor));
      },
    },
    messages: {
      ...messages,
      async listByChatDate(userId, chatDate) {
        const own = await messages.list(userId);
        return own.filter((message) => message.chatDate === chatDate).sort(byInstant((message) => message.createdAt));
      },
    },
    openQuestions: ownedRepository(tables.openQuestions),
    progressReports: ownedRepository(tables.progressReports),
  };

  // Server-only: due reminders across all users, for the reminder job.
  const dueReminders: DueReminderSource = {
    async listDueForAllUsers(at) {
      return [...tables.reminders.values()]
        .filter((reminder) => isDue(reminder, at))
        .sort(byInstant((reminder) => reminder.scheduledFor))
        .map(copy);
    },
  };

  return {
    repos,
    dueReminders,
    clear() {
      users.clear();
      Object.values(tables).forEach((table) => table.clear());
    },
  };
}
