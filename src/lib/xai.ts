import "server-only";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatParams = {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  signal?: AbortSignal;
};

const DEFAULT_XAI_MODEL = "grok-4.6";

export function getXaiConfig() {
  const apiKey = process.env.XAI_API_KEY;
  const model = process.env.XAI_MODEL || DEFAULT_XAI_MODEL;
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not set on the server");
  }
  return { apiKey, model };
}

export async function* streamXaiCompletion(
  params: ChatParams
): AsyncGenerator<string, void, unknown> {
  const { apiKey, model: defaultModel } = getXaiConfig();
  const model = params.model || defaultModel;
  const temperature = params.temperature ?? 0.7;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: params.signal,
    body: JSON.stringify({
      model,
      messages: params.messages,
      temperature,
      max_tokens: 512,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`xAI error ${res.status}: ${text.slice(0, 500)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length) {
          yield delta;
        }
      } catch {
        // Ignore malformed events so a partial stream can continue.
      }
    }
  }
}
