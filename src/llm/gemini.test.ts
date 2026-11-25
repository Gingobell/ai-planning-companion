import { ApiError, type GenerateContentParameters } from "@google/genai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createGeminiModel, DEFAULT_GEMINI_MODEL, type GeminiClient } from "@/llm/gemini";

const KEY = "test-key-not-real-1234567890";
const request = { system: "Extract items.", prompt: "Lab 5 is due Thursday", jsonSchema: { type: "object" } };

function clientReturning(answer: () => Promise<{ text?: string }>) {
  const calls: GenerateContentParameters[] = [];
  const client: GeminiClient = {
    models: {
      generateContent: (params) => {
        calls.push(params);
        return answer();
      },
    },
  };
  return { client, calls };
}

afterEach(() => vi.restoreAllMocks());

describe("Gemini adapter", () => {
  it("fails with a clear message when GEMINI_API_KEY is missing", () => {
    expect(() => createGeminiModel({})).toThrow(/GEMINI_API_KEY is not set/);
  });

  it("asks for JSON that matches the schema and returns the parsed answer", async () => {
    const { client, calls } = clientReturning(async () => ({ text: '{"items":[]}' }));
    const model = createGeminiModel({ GEMINI_API_KEY: KEY }, client);
    expect(await model.generateJson(request)).toEqual({ kind: "ok", value: { items: [] } });
    expect(calls[0]).toMatchObject({
      model: DEFAULT_GEMINI_MODEL,
      contents: request.prompt,
      config: {
        systemInstruction: request.system,
        responseMimeType: "application/json",
        responseJsonSchema: { type: "object" },
      },
    });
  });

  it("uses GEMINI_MODEL when it is set", async () => {
    const { client, calls } = clientReturning(async () => ({ text: "{}" }));
    await createGeminiModel({ GEMINI_API_KEY: KEY, GEMINI_MODEL: "gemini-3.8-flash" }, client).generateJson(request);
    expect(calls[0].model).toBe("gemini-3.8-flash");
  });

  it.each([
    ["text that is not JSON", "Sure! Here are your items."],
    ["an empty answer", ""],
  ])("treats %s as invalid output", async (_case, text) => {
    const { client } = clientReturning(async () => ({ text }));
    expect(await createGeminiModel({ GEMINI_API_KEY: KEY }, client).generateJson(request)).toEqual({
      kind: "invalid-output",
    });
  });

  it.each([
    ["a rate limit", new ApiError({ message: "Resource exhausted", status: 429 })],
    ["a server error", new ApiError({ message: "Internal", status: 500 })],
    ["a network failure", new TypeError("fetch failed")],
  ])("reports %s as unavailable and logs no key or message text", async (_case, error) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { client } = clientReturning(async () => {
      throw error;
    });
    expect(await createGeminiModel({ GEMINI_API_KEY: KEY }, client).generateJson(request)).toEqual({
      kind: "unavailable",
    });
    const logged = warn.mock.calls.flat().join(" ");
    expect(logged).not.toContain(KEY);
    expect(logged).not.toContain(request.prompt);
  });
});
