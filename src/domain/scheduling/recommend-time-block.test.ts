import { describe, expect, it } from "vitest";
import { recommendTimeBlock, type RecommendTimeBlockInput } from "./recommend-time-block";

// Monday 2026-11-23, 08:00 in Los Angeles (PST, UTC-8).
const baseInput: RecommendTimeBlockInput = {
  now: "2026-11-23T16:00:00Z",
  timeZone: "America/Los_Angeles",
  task: { estimatedMinutes: 60 },
  availability: { 1: [{ start: "09:00", end: "17:00" }] },
  fixedCommitments: [],
  existingBlocks: [],
};

describe("recommendTimeBlock", () => {
  describe("AC3: a task needs a deadline before it is scheduled", () => {
    it("returns needs-deadline when the task has no deadline", () => {
      expect(recommendTimeBlock(baseInput)).toEqual({ kind: "needs-deadline" });
    });
  });
});
