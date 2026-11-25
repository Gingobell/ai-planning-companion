import { Temporal } from "temporal-polyfill";
import type { Deadline, Goal, Id, Task } from "@/domain/records";

// What the model extracted from one chat message. It is a proposal: planCapture decides what is saved.
export interface ExtractedDeadline {
  // Local date and optional time in the user's time zone, as the user said them.
  localDate: string;
  localTime?: string;
  // False when the model would only be guessing; such deadlines are never saved.
  statedByUser: boolean;
}

export interface ExtractedItem {
  kind: "goal" | "task";
  title: string;
  category: string;
  horizon?: "short" | "long";
  // A task may point at a goal from the same message by its position in `items`.
  goalIndex?: number;
  deadline?: ExtractedDeadline;
}

export interface CaptureExtraction {
  items: ExtractedItem[];
}

export interface CaptureContext {
  userId: Id;
  messageId: Id;
  timeZone: string;
}

export interface CapturePlan {
  goals: Goal[];
  tasks: Task[];
}

// Ids come from the message and the item's position, so capturing the same message again
// produces the same records instead of new ones.
function itemId(context: CaptureContext, kind: ExtractedItem["kind"], index: number): Id {
  return `${context.messageId}:${kind}:${index}`;
}

// The time used when the user names a day but no time: the end of that day.
const END_OF_DAY = "23:59";

// A deadline is kept only when the user stated it and it is a real local date and time; a guess
// or an impossible date is dropped rather than repaired (PRD Section 6, "Deadlines").
function statedDeadline(deadline: ExtractedDeadline | undefined, timeZone: string): Deadline | undefined {
  if (deadline === undefined || !deadline.statedByUser) return undefined;
  try {
    const date = Temporal.PlainDate.from(deadline.localDate, { overflow: "reject" });
    const time = Temporal.PlainTime.from(deadline.localTime ?? END_OF_DAY, { overflow: "reject" });
    const at = date.toPlainDateTime(time).toZonedDateTime(timeZone, { disambiguation: "compatible" }).toInstant();
    return { at: at.toString(), source: "external" };
  } catch {
    return undefined;
  }
}

const withDeadline = (deadline: Deadline | undefined) => (deadline === undefined ? {} : { deadline });

export function planCapture(extraction: CaptureExtraction, context: CaptureContext): CapturePlan {
  const { items } = extraction;
  const goals = items.flatMap((item, index): Goal[] =>
    item.kind === "goal"
      ? [
          {
            id: itemId(context, "goal", index),
            userId: context.userId,
            version: 0,
            title: item.title,
            category: item.category,
            horizon: item.horizon ?? "long",
            ...withDeadline(statedDeadline(item.deadline, context.timeZone)),
            status: "active",
          },
        ]
      : [],
  );
  // A link counts only when it points at a goal from the same message.
  const goalIdAt = (index: number | undefined) =>
    index !== undefined && items[index]?.kind === "goal" ? itemId(context, "goal", index) : undefined;

  const tasks = items.flatMap((item, index): Task[] => {
    if (item.kind !== "task") return [];
    const goalId = goalIdAt(item.goalIndex);
    return [
      {
        id: itemId(context, "task", index),
        userId: context.userId,
        version: 0,
        title: item.title,
        category: item.category,
        ...(goalId === undefined ? {} : { goalId }),
        ...withDeadline(statedDeadline(item.deadline, context.timeZone)),
        priority: "medium",
        status: "not-started",
        remindersEnabled: false,
        acceptance: "accepted",
      },
    ];
  });
  return { goals, tasks };
}
