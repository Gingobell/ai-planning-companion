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
  throw new Error("not implemented");
}
