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

  const deadline = toZoned(input.task.deadline, input.timeZone);
  const earliestStart = roundUpToSlot(toZoned(input.now, input.timeZone));

  const busy = [...input.fixedCommitments, ...input.existingBlocks].map((interval) => ({
    start: toZoned(interval.start, input.timeZone),
    end: toZoned(interval.end, input.timeZone),
  }));

  for (const window of availableWindows(input, earliestStart.toPlainDate(), deadline.toPlainDate())) {
    let start = later(earliestStart, window.start);
    let end = start.add({ minutes: input.task.estimatedMinutes });
    let conflict = busy.find((b) => isBefore(b.start, end) && isBefore(start, b.end));
    while (conflict !== undefined) {
      start = conflict.end;
      end = start.add({ minutes: input.task.estimatedMinutes });
      conflict = busy.find((b) => isBefore(b.start, end) && isBefore(start, b.end));
    }
    if (isAtOrBefore(end, window.end) && isAtOrBefore(end, deadline)) {
      return { kind: "scheduled", block: toTimeInterval(start, end), preference: "none" };
    }
  }

  throw new Error("not implemented");
}

const SLOT_MINUTES = 15;

interface ZonedWindow {
  start: Temporal.ZonedDateTime;
  end: Temporal.ZonedDateTime;
}

function* availableWindows(
  input: RecommendTimeBlockInput,
  firstDate: Temporal.PlainDate,
  lastDate: Temporal.PlainDate,
): Generator<ZonedWindow> {
  for (let date = firstDate; Temporal.PlainDate.compare(date, lastDate) <= 0; date = date.add({ days: 1 })) {
    for (const window of input.availability[date.dayOfWeek as IsoWeekday] ?? []) {
      yield {
        start: atLocalTime(date, window.start, input.timeZone),
        end: atLocalTime(date, window.end, input.timeZone),
      };
    }
  }
}

function toZoned(instant: string, timeZone: string): Temporal.ZonedDateTime {
  return Temporal.Instant.from(instant).toZonedDateTimeISO(timeZone);
}

function atLocalTime(date: Temporal.PlainDate, time: string, timeZone: string): Temporal.ZonedDateTime {
  return date.toPlainDateTime(Temporal.PlainTime.from(time)).toZonedDateTime(timeZone);
}

function roundUpToSlot(time: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
  return time.round({ smallestUnit: "minute", roundingIncrement: SLOT_MINUTES, roundingMode: "ceil" });
}

function later(a: Temporal.ZonedDateTime, b: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
  return Temporal.ZonedDateTime.compare(a, b) >= 0 ? a : b;
}

function isBefore(a: Temporal.ZonedDateTime, b: Temporal.ZonedDateTime): boolean {
  return Temporal.ZonedDateTime.compare(a, b) < 0;
}

function isAtOrBefore(a: Temporal.ZonedDateTime, b: Temporal.ZonedDateTime): boolean {
  return Temporal.ZonedDateTime.compare(a, b) <= 0;
}

function toTimeInterval(start: Temporal.ZonedDateTime, end: Temporal.ZonedDateTime): TimeInterval {
  return { start: start.toInstant().toString(), end: end.toInstant().toString() };
}
