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

export function planReminders(input: PlanRemindersInput): ReminderPlan {
  void input;
  throw new Error("not implemented");
}
