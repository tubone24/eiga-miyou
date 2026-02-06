import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const IS_DEV = process.env.DEV_MODE === "true";

// retry-after ヘッダーを尊重するカスタム fetch
const fetchWithRetryAfter: typeof globalThis.fetch = async (input, init) => {
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await globalThis.fetch(input, init);
    if (res.status !== 429 || attempt === maxAttempts - 1) return res;

    const retryAfter = parseInt(res.headers.get("retry-after") ?? "30", 10);
    const delay = Math.min(retryAfter, 60) * 1000;
    console.warn(
      `[model] 429 レートリミット。${retryAfter}秒後にリトライ (${attempt + 1}/${maxAttempts})`,
    );
    await new Promise((r) => setTimeout(r, delay));
  }
  // unreachable, but TypeScript needs it
  return globalThis.fetch(input, init);
};

const anthropic = createAnthropic({
  fetch: fetchWithRetryAfter,
});

const dockerModelRunner = IS_DEV
  ? createOpenAICompatible({
      name: "docker-model-runner",
      baseURL: "http://localhost:12434/engines/llama.cpp/v1",
      apiKey: "not-needed",
    })
  : null;

export const llm = IS_DEV
  ? dockerModelRunner!("ai/qwen3")
  : anthropic("claude-sonnet-4-5-20250929");
