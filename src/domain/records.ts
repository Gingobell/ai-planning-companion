import type { LocalWindow, TimeInterval, WeeklyAvailability } from "@/domain/scheduling/recommend-time-block";

// Shared record types for every area. Each record type is defined only here.
// Instants are ISO 8601 strings in UTC; local wall-clock values are "HH:MM" in the user's time zone.

export type Id = string;

// Every saved record carries a version so a stale edit never overwrites a newer change.
export interface Versioned {
  version: number;
}

export interface OwnedRecord extends Versioned {
  id: Id;
  userId: Id;
}

// Present while reminders are paused; without `until` the pause lasts until the user resumes.
export interface ReminderPause {
  until?: string;
}

export interface User extends Versioned {
  id: Id;
  timeZone: string;
  availability: WeeklyAvailability;
  checkInTimes: string[];
  quietHours?: LocalWindow;
  remindersPause?: ReminderPause;
}

// A deadline is external or agreed with the user, never invented by the assistant.
export interface Deadline {
  at: string;
  source: "external" | "agreed";
}

export type GoalStatus = "active" | "completed" | "canceled";

export interface Goal extends OwnedRecord {
  title: string;
  category: string;
  horizon: "short" | "long";
  deadline?: Deadline;
  status: GoalStatus;
}

export type TaskStatus = "not-started" | "in-progress" | "blocked" | "completed" | "canceled";

export interface Task extends OwnedRecord {
  title: string;
  category: string;
  goalId?: Id;
  parentTaskId?: Id;
  deadline?: Deadline;
  priority: "low" | "medium" | "high";
  estimatedMinutes?: number;
  estimateSource?: "user" | "assistant";
  status: TaskStatus;
  // Users choose which tasks get reminders; off unless the user turns it on.
  remindersEnabled: boolean;
  // Steps the assistant suggests stay "proposed" until the user accepts them.
  acceptance: "proposed" | "accepted";
}

export interface TimeBlock extends OwnedRecord, TimeInterval {
  taskId: Id;
  status: "proposed" | "accepted";
}

export interface FixedCommitment extends OwnedRecord, TimeInterval {
  title?: string;
}

export type PreferenceStatus = "tentative" | "confirmed" | "corrected" | "removed";

export interface Preference extends OwnedRecord {
  description: string;
  scope: string;
  preferredWindow?: LocalWindow;
  status: PreferenceStatus;
  source: "user-stated" | "confirmed-inference";
  // Set when this preference is corrected, so the replaced version is never restored.
  supersededBy?: Id;
}

export interface TemporaryContext extends OwnedRecord {
  description: string;
  startsAt: string;
  endsAt: string;
}

export interface Reminder extends OwnedRecord {
  kind: "task" | "check-in";
  taskId?: Id;
  timeBlockId?: Id;
  scheduledFor: string;
  status: "pending" | "delivered" | "canceled";
  // Stable key so a delivery retry never creates a duplicate reminder.
  deliveryKey: string;
  // Check-ins only. Delivered without answeredAt means unanswered, which leaves progress unknown.
  answeredAt?: string;
}

export interface Message extends OwnedRecord {
  // One chat per local day in the user's time zone, as "YYYY-MM-DD".
  chatDate: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}

export interface OpenQuestion extends OwnedRecord {
  taskId?: Id;
  question: string;
  status: "open" | "answered";
}

export type ProgressReportKind = "partial" | "blocker" | "completed" | "correction";

export interface ProgressReport extends OwnedRecord {
  taskId: Id;
  kind: ProgressReportKind;
  note: string;
  reportedAt: string;
}
