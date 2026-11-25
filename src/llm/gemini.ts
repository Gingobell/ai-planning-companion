import { ApiError, GoogleGenAI, type GenerateContentParameters } from "@google/genai";
import type { GenerateJsonRequest, GenerateJsonResult, LanguageModel } from "@/llm/language-model";

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

export type GeminiEnv = { GEMINI_API_KEY?: string; GEMINI_MODEL?: string } & Record<string, string | undefined>;

// The part of the SDK client this adapter uses, so tests can pass a double instead.
export interface GeminiClient {
  models: { generateContent(params: GenerateContentParameters): Promise<{ text?: string }> };
}

// Logs only a status code: never the key, the prompt or the model's answer (CLAUDE.md "Logging").
function logFailure(error: unknown) {
  const status = error instanceof ApiError ? error.status : "network";
  console.warn(`[gemini] request failed (status ${status})`);
}

export function createGeminiModel(env: GeminiEnv = process.env, client?: GeminiClient): LanguageModel {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Copy .env.example to .env.local, or set it in Vercel.");
  }
  const gemini: GeminiClient = client ?? new GoogleGenAI({ apiKey });
  const model = env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  return {
    async generateJson({ system, prompt, jsonSchema }: GenerateJsonRequest): Promise<GenerateJsonResult> {
      let text: string | undefined;
      try {
        const response = await gemini.models.generateContent({
          model,
          contents: prompt,
          config: { systemInstruction: system, responseMimeType: "application/json", responseJsonSchema: jsonSchema },
        });
        text = response.text;
      } catch (error) {
        // Rate limits, outages and network errors are all "try again later" for the user.
        logFailure(error);
        return { kind: "unavailable" };
      }
      if (!text) return { kind: "invalid-output" };
      try {
        return { kind: "ok", value: JSON.parse(text) };
      } catch {
        return { kind: "invalid-output" };
      }
    },
  };
}

let instance: LanguageModel | undefined;

// Created on first use, so builds and tests need no key.
export function getLanguageModel(): LanguageModel {
  instance ??= createGeminiModel();
  return instance;
}
