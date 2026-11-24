import type { Goal, Id, Task } from "@/domain/records";

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

export function planCapture(extraction: CaptureExtraction, context: CaptureContext): CapturePlan {
  const tasks = extraction.items.flatMap((item, index): Task[] =>
    item.kind === "task"
      ? [
          {
            id: itemId(context, "task", index),
            userId: context.userId,
            version: 0,
            title: item.title,
            category: item.category,
            priority: "medium",
            status: "not-started",
            remindersEnabled: false,
            acceptance: "accepted",
          },
        ]
      : [],
  );
  return { goals: [], tasks };
}
