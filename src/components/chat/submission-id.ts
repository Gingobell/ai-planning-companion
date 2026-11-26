export interface Submission {
  id: string;
  text: string;
}

export function submissionFor(previous: Submission | null, text: string, newId: () => string): Submission {
  void previous;
  void text;
  void newId;
  throw new Error("not implemented");
}
