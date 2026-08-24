import "server-only";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatParams = {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  signal?: AbortSignal;
};

const DEFAULT_OPENCODE_MODEL = "gpt-5.6-luna";

export function getOpenCodeConfig() {
  const apiKey = process.env.OPENCODE_API_KEY;
  const model = process.env.OPENCODE_MODEL || DEFAULT_OPENCODE_MODEL;
  if (!apiKey) {
    throw new Error("OPENCODE_API_KEY is not set on the server");
  }
  return { apiKey, model };
}

export async function* streamOpenCodeCompletion(
  params: ChatParams
): AsyncGenerator<string, void, unknown> {
  const { apiKey, model: defaultModel } = getOpenCodeConfig();
  const model = params.model || defaultModel;
  const temperature = params.temperature ?? 0.7;

  const res = await fetch("https://opencode.ai/zen/go/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: params.signal,
    body: JSON.stringify({
      model,
      input: params.messages,
      temperature,
      max_output_tokens: 512,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenCode Go error ${res.status}: ${text.slice(0, 500)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const event of events) {
      const data = event
        .split("\n")
        .find((line) => line.startsWith("data:"))
        ?.slice(5)
        .trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        if (json.type === "response.output_text.delta" && typeof json.delta === "string") {
          yield json.delta;
        }
      } catch {
        // Ignore malformed events so a partial stream can continue.
      }
    }
  }
}
