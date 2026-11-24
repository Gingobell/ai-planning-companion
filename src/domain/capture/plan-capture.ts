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

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub until capture is built
export function planCapture(extraction: CaptureExtraction, context: CaptureContext): CapturePlan {
  throw new Error("not implemented");
}
