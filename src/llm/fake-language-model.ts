import type { GenerateJsonRequest, GenerateJsonResult, LanguageModel } from "@/llm/language-model";

// Test double: returns scripted results in order and records every request. Tests never call a real model,
// so a passing test checks the app's behavior, not the model's quality (CLAUDE.md "Testing strategy").
export function createFakeLanguageModel(...results: GenerateJsonResult[]) {
  const requests: GenerateJsonRequest[] = [];
  const model: LanguageModel = {
    async generateJson(request) {
      requests.push(request);
      const next = results.shift();
      if (next === undefined) throw new Error("The fake language model has no scripted result left");
      return next;
    },
  };
  return { model, requests };
}
