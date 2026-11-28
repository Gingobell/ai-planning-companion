// One composer submission: its text and the message id the server uses to recognize a resend.
export interface Submission {
  id: string;
  text: string;
}

// A retry of the same text keeps its id, so nothing is saved twice (PRD Section 7). Edited text is a new
// message: with the old id the server would treat it as a resend and keep the first text. Texts are
// compared trimmed, as the server saves them.
export function submissionFor(previous: Submission | null, text: string, newId: () => string): Submission {
  return previous !== null && previous.text.trim() === text.trim() ? previous : { id: newId(), text };
}
