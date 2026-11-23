import { describe, expect, it } from "vitest";
import type { Reminder, Task, TimeBlock, User } from "@/domain/records";
import { planReminders, type PlanRemindersInput, type ReminderDraft } from "@/domain/reminders/plan-reminders";

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

function checkIn(localDateTime: string, scheduledFor: string): ReminderDraft {
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

const quietUser: User = { ...user, checkInTimes: [] };

function chosenTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    userId: "user-1",
    version: 1,
    title: "Practice interview answers",
    category: "Career",
    priority: "high",
    status: "not-started",
    remindersEnabled: true,
    acceptance: "accepted",
    ...overrides,
  };
}

function block(overrides: Partial<TimeBlock> = {}): TimeBlock {
  return {
    id: "block-1",
    userId: "user-1",
    version: 1,
    taskId: "task-1",
    // 19:00 to 20:00 local on November 24.
    start: "2026-11-25T03:00:00Z",
    end: "2026-11-25T04:00:00Z",
    status: "accepted",
    ...overrides,
  };
}

const taskReminder: ReminderDraft = {
  kind: "task",
  taskId: "task-1",
  timeBlockId: "block-1",
  scheduledFor: "2026-11-25T03:00:00Z",
  deliveryKey: "block:block-1:2026-11-25T03:00:00Z",
};

describe("planReminders for tasks", () => {
  describe("AC2: only tasks the user chose get reminders", () => {
    it("reminds at the start of an accepted block of a chosen task", () => {
      const plan = planReminders(input({ user: quietUser, tasks: [chosenTask()], timeBlocks: [block()] }));
      expect(plan).toEqual({ create: [taskReminder], cancel: [] });
    });

    it("creates no reminder for a task without reminders enabled", () => {
      const tasks = [chosenTask({ remindersEnabled: false })];
      expect(planReminders(input({ user: quietUser, tasks, timeBlocks: [block()] })).create).toEqual([]);
    });

    it("creates no reminder for a proposed block", () => {
      const timeBlocks = [block({ status: "proposed" })];
      expect(planReminders(input({ user: quietUser, tasks: [chosenTask()], timeBlocks })).create).toEqual([]);
    });

    it.each(["completed", "canceled"] as const)("creates no reminder for a %s task", (status) => {
      const tasks = [chosenTask({ status })];
      expect(planReminders(input({ user: quietUser, tasks, timeBlocks: [block()] })).create).toEqual([]);
    });

    it("creates no reminder for a block that already started", () => {
      const timeBlocks = [block({ start: "2026-11-24T15:00:00Z", end: "2026-11-24T17:00:00Z" })];
      expect(planReminders(input({ user: quietUser, tasks: [chosenTask()], timeBlocks })).create).toEqual([]);
    });
  });
});

describe("planReminders with quiet hours and pausing", () => {
  describe("AC3: nothing is scheduled inside quiet hours or while paused", () => {
    const keys = (plan: { create: { deliveryKey: string }[] }) => plan.create.map((draft) => draft.deliveryKey);

    it("drops a check-in inside quiet hours that cross midnight", () => {
      const plan = planReminders(input({ user: { ...user, quietHours: { start: "20:00", end: "08:00" } } }));
      expect(keys(plan)).toEqual(["check-in:2026-11-24T09:00", "check-in:2026-11-25T09:00"]);
    });

    it("drops a check-in inside quiet hours within one day", () => {
      const plan = planReminders(
        input({ horizonDays: 1, user: { ...user, checkInTimes: ["13:00", "15:00"], quietHours: { start: "12:00", end: "14:00" } } }),
      );
      expect(keys(plan)).toEqual(["check-in:2026-11-24T15:00"]);
    });

    it("keeps a check-in at the exact end of quiet hours", () => {
      const plan = planReminders(
        input({ horizonDays: 1, user: { ...user, checkInTimes: ["14:00"], quietHours: { start: "12:00", end: "14:00" } } }),
      );
      expect(keys(plan)).toEqual(["check-in:2026-11-24T14:00"]);
    });

    it("drops a task reminder inside quiet hours", () => {
      const plan = planReminders(
        input({
          user: { ...quietUser, quietHours: { start: "18:00", end: "22:00" } },
          tasks: [chosenTask()],
          timeBlocks: [block()],
        }),
      );
      expect(plan.create).toEqual([]);
    });

    it("drops reminders until a pause ends and keeps those after it", () => {
      // Paused until 04:00 local on November 25.
      const plan = planReminders(input({ user: { ...user, remindersPause: { until: "2026-11-25T12:00:00Z" } } }));
      expect(keys(plan)).toEqual(["check-in:2026-11-25T09:00", "check-in:2026-11-25T21:00"]);
    });

    it("drops every reminder while paused without an end", () => {
      const plan = planReminders(
        input({ user: { ...user, remindersPause: {} }, tasks: [chosenTask()], timeBlocks: [block()] }),
      );
      expect(plan.create).toEqual([]);
    });
  });
});

function saved(id: string, draft: ReminderDraft, status: Reminder["status"] = "pending"): Reminder {
  return { id, version: 1, userId: "user-1", status, ...draft };
}

describe("planReminders against saved reminders", () => {
  describe("AC4: completed, canceled and moved work updates its reminders", () => {
    it.each(["completed", "canceled"] as const)("cancels the pending reminder of a %s task", (status) => {
      const plan = planReminders(
        input({
          user: quietUser,
          tasks: [chosenTask({ status })],
          timeBlocks: [block()],
          existing: [saved("r1", taskReminder)],
        }),
      );
      expect(plan).toEqual({ create: [], cancel: ["r1"] });
    });

    it("cancels the old reminder and creates a new one when a block moves", () => {
      const moved = block({ start: "2026-11-25T17:00:00Z", end: "2026-11-25T18:00:00Z" });
      const plan = planReminders(
        input({ user: quietUser, tasks: [chosenTask()], timeBlocks: [moved], existing: [saved("r1", taskReminder)] }),
      );
      expect(plan).toEqual({
        create: [{ ...taskReminder, scheduledFor: "2026-11-25T17:00:00Z", deliveryKey: "block:block-1:2026-11-25T17:00:00Z" }],
        cancel: ["r1"],
      });
    });

    it("cancels the pending reminder of a block that was removed", () => {
      const plan = planReminders(
        input({ user: quietUser, tasks: [chosenTask()], timeBlocks: [], existing: [saved("r1", taskReminder)] }),
      );
      expect(plan.cancel).toEqual(["r1"]);
    });

    it("cancels a pending check-in at a time the user no longer wants", () => {
      const old = checkIn("2026-11-24T12:00", "2026-11-24T20:00:00Z");
      const plan = planReminders(input({ horizonDays: 1, user: { ...user, checkInTimes: [] }, existing: [saved("r1", old)] }));
      expect(plan.cancel).toEqual(["r1"]);
    });

    it("never cancels a delivered reminder", () => {
      const plan = planReminders(
        input({
          user: quietUser,
          tasks: [chosenTask({ status: "completed" })],
          timeBlocks: [block()],
          existing: [saved("r1", taskReminder, "delivered")],
        }),
      );
      expect(plan.cancel).toEqual([]);
    });

    it("keeps a pending reminder that is due but not yet delivered", () => {
      // The block started at 07:00 local; its reminder waits for delivery.
      const started = block({ start: "2026-11-24T15:00:00Z", end: "2026-11-24T17:00:00Z" });
      const due = { ...taskReminder, scheduledFor: started.start, deliveryKey: "block:block-1:2026-11-24T15:00:00Z" };
      const plan = planReminders(
        input({ user: quietUser, tasks: [chosenTask()], timeBlocks: [started], existing: [saved("r1", due)] }),
      );
      expect(plan.cancel).toEqual([]);
    });
  });
});

describe("planReminders without duplicates", () => {
  describe("AC5: a reminder that already exists is never created again", () => {
    const withTask = { user, tasks: [chosenTask()], timeBlocks: [block()] };

    it.each(["pending", "delivered"] as const)("does not recreate a %s reminder with the same key", (status) => {
      const plan = planReminders(input({ ...withTask, existing: [saved("r1", taskReminder, status)] }));
      expect(plan.create.map((draft) => draft.deliveryKey)).not.toContain(taskReminder.deliveryKey);
    });

    it("plans nothing new when run again on its own saved result", () => {
      const first = planReminders(input(withTask));
      const existing = first.create.map((draft, index) => saved(`r${index}`, draft));
      expect(planReminders(input({ ...withTask, existing }))).toEqual({ create: [], cancel: [] });
    });

    it("gives the same key however the block start is written", () => {
      const written = block({ start: "2026-11-25T03:00:00.000Z" });
      const plan = planReminders(
        input({ user: quietUser, tasks: [chosenTask()], timeBlocks: [written], existing: [saved("r1", taskReminder)] }),
      );
      expect(plan).toEqual({ create: [], cancel: [] });
    });
  });
});

describe("planReminders purity", () => {
  describe("AC7: inputs are not mutated and the same input gives the same plan", () => {
    it("leaves its input unchanged and repeats its result", () => {
      const given = input({ tasks: [chosenTask()], timeBlocks: [block()], existing: [saved("r1", taskReminder)] });
      const before = structuredClone(given);
      const first = planReminders(given);
      expect(given).toEqual(before);
      expect(planReminders(given)).toEqual(first);
    });
  });
});
