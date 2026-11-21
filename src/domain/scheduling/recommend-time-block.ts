import { Temporal } from "temporal-polyfill";

export interface TimeInterval {
  start: string;
  end: string;
}

export interface LocalWindow {
  start: string;
  end: string;
}

export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type WeeklyAvailability = Partial<Record<IsoWeekday, LocalWindow[]>>;

export interface RecommendTimeBlockInput {
  now: string;
  timeZone: string;
  task: { estimatedMinutes: number; deadline?: string };
  availability: WeeklyAvailability;
  fixedCommitments: TimeInterval[];
  existingBlocks: TimeInterval[];
  preferredWindow?: LocalWindow;
}

export type TimeBlockRecommendation =
  | { kind: "scheduled"; block: TimeInterval; preference: "met" | "unavailable" | "none" }
  | { kind: "needs-deadline" }
  | { kind: "infeasible"; reason: "deadline-passed" | "no-free-slot" };

export function recommendTimeBlock(input: RecommendTimeBlockInput): TimeBlockRecommendation {
  if (input.task.deadline === undefined) {
    return { kind: "needs-deadline" };
  }

  const deadline = Temporal.Instant.from(input.task.deadline).toZonedDateTimeISO(input.timeZone);
  const earliestStart = Temporal.Instant.from(input.now)
    .toZonedDateTimeISO(input.timeZone)
    .round({ smallestUnit: "minute", roundingIncrement: 15, roundingMode: "ceil" });

  for (
    let date = earliestStart.toPlainDate();
    Temporal.PlainDate.compare(date, deadline.toPlainDate()) <= 0;
    date = date.add({ days: 1 })
  ) {
    const windows = input.availability[date.dayOfWeek as IsoWeekday] ?? [];
    for (const window of windows) {
      const windowStart = date.toPlainDateTime(Temporal.PlainTime.from(window.start)).toZonedDateTime(input.timeZone);
      const windowEnd = date.toPlainDateTime(Temporal.PlainTime.from(window.end)).toZonedDateTime(input.timeZone);
      const start = Temporal.ZonedDateTime.compare(earliestStart, windowStart) > 0 ? earliestStart : windowStart;
      const end = start.add({ minutes: input.task.estimatedMinutes });
      if (Temporal.ZonedDateTime.compare(end, windowEnd) <= 0 && Temporal.ZonedDateTime.compare(end, deadline) <= 0) {
        return {
          kind: "scheduled",
          block: { start: start.toInstant().toString(), end: end.toInstant().toString() },
          preference: "none",
        };
      }
    }
  }

  throw new Error("not implemented");
}
