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

export function planReminders(input: PlanRemindersInput): ReminderPlan {
  const create = checkIns(input).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  return { create, cancel: [] };
}
