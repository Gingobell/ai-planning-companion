import type { Reminder } from "@/domain/records";

export type CheckInOutcome = "answered" | "unknown" | "not-delivered";

// Silence is never read as failure: a delivered check-in without an answer is "unknown", not "missed".
export function checkInOutcome(reminder: Reminder): CheckInOutcome {
  if (reminder.answeredAt !== undefined) return "answered";
  return reminder.status === "delivered" ? "unknown" : "not-delivered";
}
