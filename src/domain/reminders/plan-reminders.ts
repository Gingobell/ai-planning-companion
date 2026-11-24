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

function today({ now, user }: PlanRemindersInput): Temporal.PlainDate {
  return Temporal.Instant.from(now).toZonedDateTimeISO(user.timeZone).toPlainDate();
}

// The first instant after the planning horizon: local midnight after its last day.
function horizonEnd(input: PlanRemindersInput): Temporal.Instant {
  return today(input).add({ days: input.horizonDays }).toZonedDateTime(input.user.timeZone).toInstant();
}

// Every agreed check-in on each day of the horizon, including times earlier today.
function checkIns(input: PlanRemindersInput): ReminderDraft[] {
  const { horizonDays, user } = input;
  const firstDay = today(input);
  const drafts: ReminderDraft[] = [];
  for (let day = 0; day < horizonDays; day++) {
    const date = firstDay.add({ days: day });
    for (const time of user.checkInTimes) {
      const at = toInstant(date, time, user.timeZone);
      drafts.push({ kind: "check-in", scheduledFor: at.toString(), deliveryKey: `check-in:${date}T${time}` });
    }
  }
  return drafts;
}

function isOpen(task: Task): boolean {
  return task.status !== "completed" && task.status !== "canceled";
}

// Reminders only for tasks the user chose, at the start of each accepted block.
function taskReminders({ tasks, timeBlocks }: PlanRemindersInput): ReminderDraft[] {
  const chosen = new Set(tasks.filter((task) => task.remindersEnabled && isOpen(task)).map((task) => task.id));
  return timeBlocks
    .filter((block) => block.status === "accepted" && chosen.has(block.taskId))
    .map((block) => {
      // Normalized so the key is the same however the stored start was written.
      const start = Temporal.Instant.from(block.start).toString();
      return {
        kind: "task",
        taskId: block.taskId,
        timeBlockId: block.id,
        scheduledFor: start,
        deliveryKey: `block:${block.id}:${start}`,
      };
    });
}

function isBefore(a: Temporal.Instant, b: Temporal.Instant): boolean {
  return Temporal.Instant.compare(a, b) < 0;
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
  return pause.until === undefined || isBefore(at, Temporal.Instant.from(pause.until));
}

function isAllowed(draft: ReminderDraft, user: User): boolean {
  const at = Temporal.Instant.from(draft.scheduledFor);
  return !isInQuietHours(at, user) && !isPaused(at, user);
}

function isBetween(at: Temporal.Instant, start: Temporal.Instant, end: Temporal.Instant): boolean {
  return !isBefore(at, start) && isBefore(at, end);
}

// A pending reminder that is no longer wanted is canceled. A task reminder is checked at any time,
// so closed, moved or removed work loses it even when it is overdue; a check-in only inside
// the horizon from now, so a check-in already due still gets delivered.
function shouldCancel(reminder: Reminder, wantedKeys: Set<string>, input: PlanRemindersInput): boolean {
  if (reminder.status !== "pending" || wantedKeys.has(reminder.deliveryKey)) return false;
  if (reminder.kind === "task") return true;
  return isBetween(Temporal.Instant.from(reminder.scheduledFor), Temporal.Instant.from(input.now), horizonEnd(input));
}

export function planReminders(input: PlanRemindersInput): ReminderPlan {
  const now = Temporal.Instant.from(input.now);
  const wanted = [...checkIns(input), ...taskReminders(input)].filter((draft) => isAllowed(draft, input.user));
  const wantedKeys = new Set(wanted.map((draft) => draft.deliveryKey));
  // A canceled reminder does not count, so a block moved back to its old time is reminded again.
  const existingKeys = new Set(
    input.existing.filter((reminder) => reminder.status !== "canceled").map((reminder) => reminder.deliveryKey),
  );
  const create = wanted
    .filter((draft) => !existingKeys.has(draft.deliveryKey))
    .filter((draft) => !isBefore(Temporal.Instant.from(draft.scheduledFor), now))
    .sort((a, b) =>
      Temporal.Instant.compare(Temporal.Instant.from(a.scheduledFor), Temporal.Instant.from(b.scheduledFor)),
    );
  const cancel = input.existing.filter((reminder) => shouldCancel(reminder, wantedKeys, input)).map((r) => r.id);
  return { create, cancel };
}
