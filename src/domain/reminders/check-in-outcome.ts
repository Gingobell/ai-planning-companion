import type { Reminder } from "@/domain/records";

export type CheckInOutcome = "answered" | "unknown" | "not-delivered";

export function checkInOutcome(reminder: Reminder): CheckInOutcome {
  void reminder;
  throw new Error("not implemented");
}
