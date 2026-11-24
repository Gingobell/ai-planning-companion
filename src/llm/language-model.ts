import { z } from "zod";

// The one interface the app uses to call a language model, so the provider can be swapped
// without touching the domain or the UI (CLAUDE.md "The LLM sits behind an adapter").

export interface GenerateJsonRequest {
  system: string;
  prompt: string;
  jsonSchema: object;
}

// Expected failures are results, not exceptions: the caller keeps the user's input and offers a retry.
export type GenerateJsonResult = { kind: "ok"; value: unknown } | { kind: "unavailable" } | { kind: "invalid-output" };

export interface LanguageModel {
  generateJson(request: GenerateJsonRequest): Promise<GenerateJsonResult>;
}

export type ValidatedResult<T> = { kind: "ok"; value: T } | { kind: "unavailable" } | { kind: "invalid-output" };

// Asks for JSON matching `schema` and checks the answer against the same schema before anyone uses it.
// The JSON Schema sent to the model is derived from the zod schema, so the two cannot drift apart.
export async function generateValidated<T>(
  model: LanguageModel,
  request: { system: string; prompt: string },
  schema: z.ZodType<T>,
): Promise<ValidatedResult<T>> {
  const result = await model.generateJson({ ...request, jsonSchema: z.toJSONSchema(schema) });
  if (result.kind !== "ok") return result;
  const parsed = schema.safeParse(result.value);
  return parsed.success ? { kind: "ok", value: parsed.data } : { kind: "invalid-output" };
}
