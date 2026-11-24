import { describe, expect, it } from "vitest";
import type { Reminder, User } from "@/domain/records";
import { checkInOutcome } from "@/domain/reminders/check-in-outcome";
import { planReminders } from "@/domain/reminders/plan-reminders";

const checkIn: Reminder = {
  id: "r1",
  userId: "user-1",
  version: 2,
  kind: "check-in",
  scheduledFor: "2026-11-24T17:00:00Z",
  status: "delivered",
  deliveryKey: "check-in:2026-11-24T09:00",
};

describe("checkInOutcome", () => {
  describe("AC6: an unanswered check-in leaves progress unknown", () => {
    it("reports unknown for a delivered check-in without an answer", () => {
      expect(checkInOutcome(checkIn)).toBe("unknown");
    });

    it("reports answered once the user replied", () => {
      expect(checkInOutcome({ ...checkIn, answeredAt: "2026-11-24T17:20:00Z" })).toBe("answered");
    });

    it("reports not-delivered for a check-in still pending", () => {
      expect(checkInOutcome({ ...checkIn, status: "pending" })).toBe("not-delivered");
    });

    it("plans no follow-up after an unanswered check-in", () => {
      const user: User = {
        id: "user-1",
        version: 1,
        timeZone: "America/Los_Angeles",
        availability: {},
        checkInTimes: ["09:00"],
      };
      // Three hours after the unanswered 09:00 check-in.
      const base = { now: "2026-11-24T20:00:00Z", horizonDays: 2, user, tasks: [], timeBlocks: [] };
      expect(planReminders({ ...base, existing: [checkIn] })).toEqual(planReminders({ ...base, existing: [] }));
    });
  });
});
