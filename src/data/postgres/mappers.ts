import { Temporal } from "temporal-polyfill";
import type {
  Deadline,
  FixedCommitment,
  Goal,
  Message,
  OpenQuestion,
  Preference,
  ProgressReport,
  Reminder,
  Task,
  TemporaryContext,
  TimeBlock,
  User,
} from "@/domain/records";
import type * as schema from "@/data/postgres/schema";

// Row <-> record conversion. Optional record fields are stored as NULL and come back missing,
// and instants come back in the domain's ISO 8601 UTC form.

type Row<T extends { $inferSelect: unknown }> = T["$inferSelect"];

// PostgreSQL returns timestamptz text like "2026-11-24 17:00:00+00"; Temporal normalizes it.
function instant(value: string): string {
  return Temporal.Instant.from(value).toString();
}

function optionalInstant(value: string | null): string | undefined {
  return value === null ? undefined : instant(value);
}

function optional<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

// Drops keys whose value is undefined so records compare equal to ones built without them.
function compact<T extends object>(record: T): T {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as T;
}

function deadlineFromRow(at: string | null, source: Deadline["source"] | null): Deadline | undefined {
  return at === null || source === null ? undefined : { at: instant(at), source };
}

function deadlineToRow(deadline: Deadline | undefined) {
  return { deadlineAt: deadline?.at ?? null, deadlineSource: deadline?.source ?? null };
}

export const userMapper = {
  toRow: (user: User) => ({
    ...user,
    quietHours: user.quietHours ?? null,
    remindersPause: user.remindersPause ?? null,
  }),
  fromRow: (row: Row<typeof schema.users>): User =>
    compact({ ...row, quietHours: optional(row.quietHours), remindersPause: optional(row.remindersPause) }),
};

export const goalMapper = {
  toRow: ({ deadline, ...goal }: Goal) => ({ ...goal, ...deadlineToRow(deadline) }),
  fromRow: ({ deadlineAt, deadlineSource, ...row }: Row<typeof schema.goals>): Goal =>
    compact({ ...row, deadline: deadlineFromRow(deadlineAt, deadlineSource) }),
};

export const taskMapper = {
  toRow: ({ deadline, ...task }: Task) => ({
    ...task,
    ...deadlineToRow(deadline),
    goalId: task.goalId ?? null,
    parentTaskId: task.parentTaskId ?? null,
    estimatedMinutes: task.estimatedMinutes ?? null,
    estimateSource: task.estimateSource ?? null,
  }),
  fromRow: ({ deadlineAt, deadlineSource, ...row }: Row<typeof schema.tasks>): Task =>
    compact({
      ...row,
      goalId: optional(row.goalId),
      parentTaskId: optional(row.parentTaskId),
      deadline: deadlineFromRow(deadlineAt, deadlineSource),
      estimatedMinutes: optional(row.estimatedMinutes),
      estimateSource: optional(row.estimateSource),
    }),
};

export const timeBlockMapper = {
  toRow: (block: TimeBlock) => block,
  fromRow: (row: Row<typeof schema.timeBlocks>): TimeBlock => ({
    ...row,
    start: instant(row.start),
    end: instant(row.end),
  }),
};

export const fixedCommitmentMapper = {
  toRow: (commitment: FixedCommitment) => ({ ...commitment, title: commitment.title ?? null }),
  fromRow: (row: Row<typeof schema.fixedCommitments>): FixedCommitment =>
    compact({ ...row, title: optional(row.title), start: instant(row.start), end: instant(row.end) }),
};

export const preferenceMapper = {
  toRow: (preference: Preference) => ({
    ...preference,
    preferredWindow: preference.preferredWindow ?? null,
    supersededBy: preference.supersededBy ?? null,
  }),
  fromRow: (row: Row<typeof schema.preferences>): Preference =>
    compact({ ...row, preferredWindow: optional(row.preferredWindow), supersededBy: optional(row.supersededBy) }),
};

export const temporaryContextMapper = {
  toRow: (context: TemporaryContext) => context,
  fromRow: (row: Row<typeof schema.temporaryContexts>): TemporaryContext => ({
    ...row,
    startsAt: instant(row.startsAt),
    endsAt: instant(row.endsAt),
  }),
};

export const reminderMapper = {
  toRow: (reminder: Reminder) => ({
    ...reminder,
    taskId: reminder.taskId ?? null,
    timeBlockId: reminder.timeBlockId ?? null,
    answeredAt: reminder.answeredAt ?? null,
  }),
  fromRow: (row: Row<typeof schema.reminders>): Reminder =>
    compact({
      ...row,
      taskId: optional(row.taskId),
      timeBlockId: optional(row.timeBlockId),
      scheduledFor: instant(row.scheduledFor),
      answeredAt: optionalInstant(row.answeredAt),
    }),
};

export const messageMapper = {
  toRow: (message: Message) => message,
  fromRow: (row: Row<typeof schema.messages>): Message => ({ ...row, createdAt: instant(row.createdAt) }),
};

export const openQuestionMapper = {
  toRow: (question: OpenQuestion) => ({
    ...question,
    taskId: question.taskId ?? null,
    proposedDeadline: question.proposedDeadline ?? null,
    askedIn: question.askedIn ?? null,
  }),
  fromRow: (row: Row<typeof schema.openQuestions>): OpenQuestion =>
    compact({
      ...row,
      taskId: optional(row.taskId),
      proposedDeadline: optionalInstant(row.proposedDeadline),
      askedIn: optional(row.askedIn),
    }),
};

export const progressReportMapper = {
  toRow: (report: ProgressReport) => report,
  fromRow: (row: Row<typeof schema.progressReports>): ProgressReport => ({
    ...row,
    reportedAt: instant(row.reportedAt),
  }),
};
