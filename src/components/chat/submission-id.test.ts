import { describe, expect, it } from "vitest";
import { submissionFor } from "@/components/chat/submission-id";

const ids = () => {
  let next = 0;
  return () => `id-${++next}`;
};

describe("submissionFor: a retry reuses the message id only for the same text", () => {
  it("makes a new id for the first send", () => {
    expect(submissionFor(null, "Email my advisor", ids())).toEqual({ id: "id-1", text: "Email my advisor" });
  });

  it("reuses the id when the same text is sent again after a failure", () => {
    const failed = { id: "id-1", text: "Email my advisor" };
    expect(submissionFor(failed, "Email my advisor", ids())).toEqual(failed);
  });

  it("makes a new id when the text changed after a failure, so the new text is saved", () => {
    const failed = { id: "id-1", text: "Email my advisor" };
    expect(submissionFor(failed, "Book a dentist appointment", () => "id-2")).toEqual({
      id: "id-2",
      text: "Book a dentist appointment",
    });
  });
});
