import { Temporal } from "temporal-polyfill";
import type { Id, Reminder, Task, TimeBlock, User } from "@/domain/records";

export type ReminderDraft = Omit<Reminder, "id" | "version" | "userId" | "status">;

export interface PlanRemindersInput {
  now: string;
  // Local days in the user's time zone, starting today.
  horizonDays: number;
  user: User;
  tasks: Task[];
  timeBlocks: TimeBlock[];
  existing: Reminder[];
}

export interface ReminderPlan {
  create: ReminderDraft[];
  // Ids of pending reminders to cancel.
  cancel: Id[];
}

// A local time that does not exist on a DST day ("compatible") moves to the next valid time.
function toInstant(date: Temporal.PlainDate, time: string, timeZone: string): Temporal.Instant {
  return date
    .toPlainDateTime(Temporal.PlainTime.from(time))
    .toZonedDateTime(timeZone, { disambiguation: "compatible" })
    .toInstant();
}

function checkIns({ now, horizonDays, user }: PlanRemindersInput): ReminderDraft[] {
  const nowInstant = Temporal.Instant.from(now);
  const today = nowInstant.toZonedDateTimeISO(user.timeZone).toPlainDate();
  const drafts: ReminderDraft[] = [];
  for (let day = 0; day < horizonDays; day++) {
    const date = today.add({ days: day });
    for (const time of user.checkInTimes) {
      const at = toInstant(date, time, user.timeZone);
      if (Temporal.Instant.compare(at, nowInstant) < 0) continue;
      drafts.push({ kind: "check-in", scheduledFor: at.toString(), deliveryKey: `check-in:${date}T${time}` });
    }
  }
  return drafts;
}

function isOpen(task: Task): boolean {
  return task.status !== "completed" && task.status !== "canceled";
}

// Reminders only for tasks the user chose, at the start of each accepted block still ahead.
function taskReminders({ now, tasks, timeBlocks }: PlanRemindersInput): ReminderDraft[] {
  const nowInstant = Temporal.Instant.from(now);
  const chosen = new Set(tasks.filter((task) => task.remindersEnabled && isOpen(task)).map((task) => task.id));
  return timeBlocks
    .filter((block) => block.status === "accepted" && chosen.has(block.taskId))
    .map((block) => ({ block, start: Temporal.Instant.from(block.start) }))
    .filter(({ start }) => Temporal.Instant.compare(start, nowInstant) >= 0)
    .map(({ block, start }) => ({
      kind: "task",
      taskId: block.taskId,
      timeBlockId: block.id,
      scheduledFor: start.toString(),
      deliveryKey: `block:${block.id}:${start}`,
    }));
}

function minuteOfDay(time: Temporal.PlainTime): number {
  return time.hour * 60 + time.minute;
}

// Quiet hours are a local window that may cross midnight; the end itself is outside it.
function isInQuietHours(at: Temporal.Instant, user: User): boolean {
  if (user.quietHours === undefined) return false;
  const minute = minuteOfDay(at.toZonedDateTimeISO(user.timeZone).toPlainTime());
  const start = minuteOfDay(Temporal.PlainTime.from(user.quietHours.start));
  const end = minuteOfDay(Temporal.PlainTime.from(user.quietHours.end));
  return start <= end ? minute >= start && minute < end : minute >= start || minute < end;
}

// A pause without an end lasts until the user resumes reminders.
function isPaused(at: Temporal.Instant, user: User): boolean {
  const pause = user.remindersPause;
  if (pause === undefined) return false;
  return pause.until === undefined || Temporal.Instant.compare(at, Temporal.Instant.from(pause.until)) < 0;
}

function isAllowed(draft: ReminderDraft, user: User): boolean {
  const at = Temporal.Instant.from(draft.scheduledFor);
  return !isInQuietHours(at, user) && !isPaused(at, user);
}

export function planReminders(input: PlanRemindersInput): ReminderPlan {
  const create = [...checkIns(input), ...taskReminders(input)]
    .filter((draft) => isAllowed(draft, input.user))
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  return { create, cancel: [] };
}
