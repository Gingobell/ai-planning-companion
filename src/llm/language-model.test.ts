import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createFakeLanguageModel } from "@/llm/fake-language-model";
import { generateValidated } from "@/llm/language-model";

const schema = z.object({ title: z.string().min(1), kind: z.enum(["goal", "task"]) });
const request = { system: "Extract one item.", prompt: "Finish lab 5" };

describe("generateValidated", () => {
  it("returns typed data when the model's answer matches the schema", async () => {
    const { model } = createFakeLanguageModel({ kind: "ok", value: { title: "Finish lab 5", kind: "task" } });
    expect(await generateValidated(model, request, schema)).toEqual({
      kind: "ok",
      value: { title: "Finish lab 5", kind: "task" },
    });
  });

  it("turns an answer that does not match the schema into invalid-output", async () => {
    const { model } = createFakeLanguageModel({ kind: "ok", value: { title: "", kind: "reminder" } });
    expect(await generateValidated(model, request, schema)).toEqual({ kind: "invalid-output" });
  });

  it("passes the model's own failures through", async () => {
    const { model } = createFakeLanguageModel({ kind: "unavailable" });
    expect(await generateValidated(model, request, schema)).toEqual({ kind: "unavailable" });
  });

  it("sends the model a JSON Schema derived from the zod schema", async () => {
    const { model, requests } = createFakeLanguageModel({ kind: "ok", value: { title: "x", kind: "goal" } });
    await generateValidated(model, request, schema);
    expect(requests[0].jsonSchema).toMatchObject({
      type: "object",
      properties: { title: { type: "string" }, kind: { enum: ["goal", "task"] } },
    });
  });
});
