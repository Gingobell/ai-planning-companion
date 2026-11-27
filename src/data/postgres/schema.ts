import { boolean, date, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type {
  Deadline,
  GoalStatus,
  LocalWindow,
  OpenQuestionTopic,
  PreferenceStatus,
  ProgressReportKind,
  Reminder,
  ReminderPause,
  Task,
  TaskStatus,
  WeeklyAvailability,
} from "@/domain/records";

// Drizzle table definitions for every record type in src/domain/records.ts.
// Instants are timestamptz; nested values are jsonb; union values are text typed from the domain.

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: "string" });

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  version: integer("version").notNull(),
  timeZone: text("time_zone").notNull(),
  availability: jsonb("availability").$type<WeeklyAvailability>().notNull(),
  checkInTimes: jsonb("check_in_times").$type<string[]>().notNull(),
  quietHours: jsonb("quiet_hours").$type<LocalWindow>(),
  remindersPause: jsonb("reminders_pause").$type<ReminderPause>(),
});

// Columns every owned record shares; deleting a user deletes their records.
const owned = () => ({
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
});

export const goals = pgTable(
  "goals",
  {
    ...owned(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    horizon: text("horizon").$type<"short" | "long">().notNull(),
    deadlineAt: instant("deadline_at"),
    deadlineSource: text("deadline_source").$type<Deadline["source"]>(),
    status: text("status").$type<GoalStatus>().notNull(),
  },
  (t) => [index("goals_user_idx").on(t.userId)],
);

export const tasks = pgTable(
  "tasks",
  {
    ...owned(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    goalId: text("goal_id"),
    parentTaskId: text("parent_task_id"),
    deadlineAt: instant("deadline_at"),
    deadlineSource: text("deadline_source").$type<Deadline["source"]>(),
    priority: text("priority").$type<Task["priority"]>().notNull(),
    estimatedMinutes: integer("estimated_minutes"),
    estimateSource: text("estimate_source").$type<NonNullable<Task["estimateSource"]>>(),
    status: text("status").$type<TaskStatus>().notNull(),
    remindersEnabled: boolean("reminders_enabled").notNull(),
    acceptance: text("acceptance").$type<Task["acceptance"]>().notNull(),
  },
  (t) => [index("tasks_user_idx").on(t.userId), index("tasks_user_goal_idx").on(t.userId, t.goalId)],
);

export const timeBlocks = pgTable(
  "time_blocks",
  {
    ...owned(),
    taskId: text("task_id").notNull(),
    start: instant("start").notNull(),
    end: instant("end").notNull(),
    status: text("status").$type<"proposed" | "accepted">().notNull(),
  },
  (t) => [index("time_blocks_user_start_idx").on(t.userId, t.start)],
);

export const fixedCommitments = pgTable(
  "fixed_commitments",
  {
    ...owned(),
    title: text("title"),
    start: instant("start").notNull(),
    end: instant("end").notNull(),
  },
  (t) => [index("fixed_commitments_user_start_idx").on(t.userId, t.start)],
);

export const preferences = pgTable(
  "preferences",
  {
    ...owned(),
    description: text("description").notNull(),
    scope: text("scope").notNull(),
    preferredWindow: jsonb("preferred_window").$type<LocalWindow>(),
    status: text("status").$type<PreferenceStatus>().notNull(),
    source: text("source").$type<"user-stated" | "confirmed-inference">().notNull(),
    supersededBy: text("superseded_by"),
  },
  (t) => [index("preferences_user_idx").on(t.userId)],
);

export const temporaryContexts = pgTable(
  "temporary_contexts",
  {
    ...owned(),
    description: text("description").notNull(),
    startsAt: instant("starts_at").notNull(),
    endsAt: instant("ends_at").notNull(),
  },
  (t) => [index("temporary_contexts_user_idx").on(t.userId)],
);

export const reminders = pgTable(
  "reminders",
  {
    ...owned(),
    kind: text("kind").$type<Reminder["kind"]>().notNull(),
    taskId: text("task_id"),
    timeBlockId: text("time_block_id"),
    scheduledFor: instant("scheduled_for").notNull(),
    status: text("status").$type<Reminder["status"]>().notNull(),
    deliveryKey: text("delivery_key").notNull(),
    answeredAt: instant("answered_at"),
  },
  (t) => [
    index("reminders_user_scheduled_idx").on(t.userId, t.scheduledFor),
    index("reminders_status_scheduled_idx").on(t.status, t.scheduledFor),
    // Delivery keys identify a reminder within one user, so two users may share one.
    uniqueIndex("reminders_user_delivery_key_idx").on(t.userId, t.deliveryKey),
  ],
);

export const messages = pgTable(
  "messages",
  {
    ...owned(),
    chatDate: date("chat_date", { mode: "string" }).notNull(),
    role: text("role").$type<"user" | "assistant">().notNull(),
    text: text("text").notNull(),
    createdAt: instant("created_at").notNull(),
  },
  (t) => [index("messages_user_chat_date_idx").on(t.userId, t.chatDate)],
);

export const openQuestions = pgTable(
  "open_questions",
  {
    ...owned(),
    taskId: text("task_id"),
    topic: text("topic").$type<OpenQuestionTopic>().notNull(),
    question: text("question").notNull(),
    status: text("status").$type<"open" | "answered">().notNull(),
    proposedDeadline: instant("proposed_deadline"),
    askedIn: text("asked_in"),
  },
  (t) => [index("open_questions_user_idx").on(t.userId)],
);

export const progressReports = pgTable(
  "progress_reports",
  {
    ...owned(),
    taskId: text("task_id").notNull(),
    kind: text("kind").$type<ProgressReportKind>().notNull(),
    note: text("note").notNull(),
    reportedAt: instant("reported_at").notNull(),
  },
  (t) => [index("progress_reports_user_task_idx").on(t.userId, t.taskId)],
);
