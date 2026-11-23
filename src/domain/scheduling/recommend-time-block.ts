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
  const now = toZoned(input.now, input.timeZone);
  if (isAtOrBefore(deadline, now)) {
    return { kind: "infeasible", reason: "deadline-passed" };
  }
  const search: SlotSearch = {
    earliestStart: roundUpToSlot(now),
    deadline,
    minutes: input.task.estimatedMinutes,
    busy: [...input.fixedCommitments, ...input.existingBlocks].map((interval) => ({
      start: toZoned(interval.start, input.timeZone),
      end: toZoned(interval.end, input.timeZone),
    })),
  };
  const windows = [...availableWindows(input, search.earliestStart.toPlainDate(), deadline.toPlainDate())];

  if (input.preferredWindow !== undefined) {
    const preferred = firstFit(insidePreferredWindow(windows, input.preferredWindow, input.timeZone), search);
    if (preferred !== undefined) {
      return scheduled(preferred, "met");
    }
  }

  const block = firstFit(windows, search);
  if (block === undefined) {
    return { kind: "infeasible", reason: "no-free-slot" };
  }
  return scheduled(block, input.preferredWindow === undefined ? "none" : "unavailable");
}

const SLOT_MINUTES = 15;

interface ZonedWindow {
  start: Temporal.ZonedDateTime;
  end: Temporal.ZonedDateTime;
}

interface SlotSearch {
  earliestStart: Temporal.ZonedDateTime;
  deadline: Temporal.ZonedDateTime;
  minutes: number;
  busy: ZonedWindow[];
}

type Preference = Extract<TimeBlockRecommendation, { kind: "scheduled" }>["preference"];

function scheduled(block: ZonedWindow, preference: Preference): TimeBlockRecommendation {
  return { kind: "scheduled", block: toTimeInterval(block.start, block.end), preference };
}

// Returns the earliest conflict-free block that fits inside one of the windows and ends by the deadline.
function firstFit(windows: Iterable<ZonedWindow>, search: SlotSearch): ZonedWindow | undefined {
  for (const window of windows) {
    const start = firstConflictFreeStart(later(search.earliestStart, window.start), search.minutes, search.busy);
    const end = start.add({ minutes: search.minutes });
    if (isAtOrBefore(end, window.end) && isAtOrBefore(end, search.deadline)) {
      return { start, end };
    }
  }
  return undefined;
}

// Pushes the start past every busy interval it would overlap. Touching edges are not overlaps.
function firstConflictFreeStart(
  candidate: Temporal.ZonedDateTime,
  minutes: number,
  busy: ZonedWindow[],
): Temporal.ZonedDateTime {
  let start = candidate;
  let conflict = busy.find((b) => overlaps(b, { start, end: start.add({ minutes }) }));
  while (conflict !== undefined) {
    start = conflict.end;
    conflict = busy.find((b) => overlaps(b, { start, end: start.add({ minutes }) }));
  }
  return start;
}

function overlaps(a: ZonedWindow, b: ZonedWindow): boolean {
  return isBefore(a.start, b.end) && isBefore(b.start, a.end);
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

function* insidePreferredWindow(
  windows: ZonedWindow[],
  preferred: LocalWindow,
  timeZone: string,
): Generator<ZonedWindow> {
  for (const window of windows) {
    const date = window.start.toPlainDate();
    const start = later(window.start, atLocalTime(date, preferred.start, timeZone));
    const end = earlier(window.end, atLocalTime(date, preferred.end, timeZone));
    if (isBefore(start, end)) {
      yield { start, end };
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

function earlier(a: Temporal.ZonedDateTime, b: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
  return Temporal.ZonedDateTime.compare(a, b) <= 0 ? a : b;
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
