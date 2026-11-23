import { describe, expect, it } from "vitest";
import type { User } from "@/domain/records";
import { planReminders, type PlanRemindersInput } from "@/domain/reminders/plan-reminders";

const user: User = {
  id: "user-1",
  version: 1,
  timeZone: "America/Los_Angeles",
  availability: {},
  checkInTimes: ["09:00", "21:00"],
};

function input(overrides: Partial<PlanRemindersInput> = {}): PlanRemindersInput {
  return {
    // 08:00 on Tuesday, November 24, 2026 in Los Angeles (PST, UTC-8).
    now: "2026-11-24T16:00:00Z",
    horizonDays: 2,
    user,
    tasks: [],
    timeBlocks: [],
    existing: [],
    ...overrides,
  };
}

function checkIn(localDateTime: string, scheduledFor: string) {
  return { kind: "check-in", scheduledFor, deliveryKey: `check-in:${localDateTime}` };
}

describe("planReminders", () => {
  describe("AC1: daily check-ins follow the agreed times in the user's time zone", () => {
    it("creates one check-in per agreed time for each day in the horizon", () => {
      expect(planReminders(input())).toEqual({
        create: [
          checkIn("2026-11-24T09:00", "2026-11-24T17:00:00Z"),
          checkIn("2026-11-24T21:00", "2026-11-25T05:00:00Z"),
          checkIn("2026-11-25T09:00", "2026-11-25T17:00:00Z"),
          checkIn("2026-11-25T21:00", "2026-11-26T05:00:00Z"),
        ],
        cancel: [],
      });
    });

    it("skips a check-in time that has already passed today", () => {
      // 10:00 local, after the 09:00 check-in.
      const plan = planReminders(input({ now: "2026-11-24T18:00:00Z", horizonDays: 1 }));
      expect(plan.create).toEqual([checkIn("2026-11-24T21:00", "2026-11-25T05:00:00Z")]);
    });

    it("maps a check-in to the right instant on the spring-forward day", () => {
      const plan = planReminders(
        input({ now: "2027-03-14T08:00:00Z", horizonDays: 1, user: { ...user, checkInTimes: ["09:00"] } }),
      );
      // 09:00 PDT is UTC-7.
      expect(plan.create).toEqual([checkIn("2027-03-14T09:00", "2027-03-14T16:00:00Z")]);
    });

    it("moves a check-in time that does not exist on the spring-forward day to the next valid time", () => {
      const plan = planReminders(
        input({ now: "2027-03-14T08:00:00Z", horizonDays: 1, user: { ...user, checkInTimes: ["02:30"] } }),
      );
      // 02:30 is skipped; 03:30 PDT is 10:30 UTC.
      expect(plan.create).toEqual([checkIn("2027-03-14T02:30", "2027-03-14T10:30:00Z")]);
    });

    it("maps a check-in to the right instant on the fall-back day", () => {
      const plan = planReminders(
        input({ now: "2026-11-01T07:30:00Z", horizonDays: 1, user: { ...user, checkInTimes: ["09:00"] } }),
      );
      // 09:00 PST is UTC-8.
      expect(plan.create).toEqual([checkIn("2026-11-01T09:00", "2026-11-01T17:00:00Z")]);
    });
  });
});
