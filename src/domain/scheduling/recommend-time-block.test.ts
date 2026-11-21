import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";
import { recommendTimeBlock, type RecommendTimeBlockInput } from "./recommend-time-block";

const TIME_ZONE = "America/Los_Angeles";

// Converts a Los Angeles wall-clock time such as "2026-11-23T09:00" to a UTC instant string.
function local(dateTime: string): string {
  return Temporal.PlainDateTime.from(dateTime).toZonedDateTime(TIME_ZONE).toInstant().toString();
}

// Monday 2026-11-23, 08:00 in Los Angeles (PST, UTC-8).
const baseInput: RecommendTimeBlockInput = {
  now: "2026-11-23T16:00:00Z",
  timeZone: TIME_ZONE,
  task: { estimatedMinutes: 60 },
  availability: { 1: [{ start: "09:00", end: "17:00" }] },
  fixedCommitments: [],
  existingBlocks: [],
};

function withDeadline(overrides: Partial<RecommendTimeBlockInput> = {}): RecommendTimeBlockInput {
  return {
    ...baseInput,
    task: { estimatedMinutes: 60, deadline: local("2026-11-27T17:00") },
    ...overrides,
  };
}

describe("recommendTimeBlock", () => {
  describe("AC3: a task needs a deadline before it is scheduled", () => {
    it("returns needs-deadline when the task has no deadline", () => {
      expect(recommendTimeBlock(baseInput)).toEqual({ kind: "needs-deadline" });
    });
  });

  describe("AC1: earliest feasible block", () => {
    it("starts at the beginning of availability when now is earlier", () => {
      expect(recommendTimeBlock(withDeadline())).toEqual({
        kind: "scheduled",
        block: { start: local("2026-11-23T09:00"), end: local("2026-11-23T10:00") },
        preference: "none",
      });
    });

    it("rounds now up to the next 15-minute boundary inside availability", () => {
      const result = recommendTimeBlock(withDeadline({ now: local("2026-11-23T10:07") }));
      expect(result).toMatchObject({
        kind: "scheduled",
        block: { start: local("2026-11-23T10:15"), end: local("2026-11-23T11:15") },
      });
    });

    it("keeps now when it is already on a 15-minute boundary", () => {
      const result = recommendTimeBlock(withDeadline({ now: local("2026-11-23T10:30") }));
      expect(result).toMatchObject({ block: { start: local("2026-11-23T10:30") } });
    });

    it("makes the block exactly as long as the estimate", () => {
      const result = recommendTimeBlock(
        withDeadline({ task: { estimatedMinutes: 90, deadline: local("2026-11-27T17:00") } }),
      );
      expect(result).toMatchObject({
        block: { start: local("2026-11-23T09:00"), end: local("2026-11-23T10:30") },
      });
    });

    it("uses the next available weekday when today has no availability", () => {
      const result = recommendTimeBlock(
        withDeadline({ availability: { 3: [{ start: "13:00", end: "15:00" }] } }),
      );
      expect(result).toMatchObject({
        block: { start: local("2026-11-25T13:00"), end: local("2026-11-25T14:00") },
      });
    });
  });

  describe("AC2: no double-booking", () => {
    function interval(start: string, end: string) {
      return { start: local(start), end: local(end) };
    }

    it("starts right after a fixed commitment that ends when the window opens", () => {
      const result = recommendTimeBlock(
        withDeadline({ fixedCommitments: [interval("2026-11-23T09:00", "2026-11-23T10:00")] }),
      );
      expect(result).toMatchObject({
        block: { start: local("2026-11-23T10:00"), end: local("2026-11-23T11:00") },
      });
    });

    it("skips an existing time block", () => {
      const result = recommendTimeBlock(
        withDeadline({ existingBlocks: [interval("2026-11-23T09:30", "2026-11-23T10:30")] }),
      );
      expect(result).toMatchObject({ block: { start: local("2026-11-23T10:30") } });
    });

    it("does not use a gap shorter than the estimate", () => {
      const result = recommendTimeBlock(
        withDeadline({ fixedCommitments: [interval("2026-11-23T09:30", "2026-11-23T10:00")] }),
      );
      expect(result).toMatchObject({ block: { start: local("2026-11-23T10:00") } });
    });

    it("moves to the next day when today is fully booked", () => {
      const result = recommendTimeBlock(
        withDeadline({
          availability: { 1: [{ start: "09:00", end: "17:00" }], 2: [{ start: "09:00", end: "17:00" }] },
          fixedCommitments: [interval("2026-11-23T09:00", "2026-11-23T17:00")],
        }),
      );
      expect(result).toMatchObject({
        block: { start: local("2026-11-24T09:00"), end: local("2026-11-24T10:00") },
      });
    });
  });
});
