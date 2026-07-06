import "server-only";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatParams = {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  signal?: AbortSignal;
};

export function getGroqConfig() {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set on the server");
  }
  return { apiKey, model };
}

export async function* streamGroqCompletion(
  params: ChatParams
): AsyncGenerator<string, void, unknown> {
  const { apiKey, model: defaultModel } = getGroqConfig();
  const model = params.model || defaultModel;
  const temperature = params.temperature ?? 0.7;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
    throw new Error(`Groq error ${res.status}: ${text.slice(0, 500)}`);
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
        // partial JSON across chunks — ignore, will be completed next iteration
      }
    }
  }
}

export async function transcribeWithGroq(
  audio: Blob,
  signal?: AbortSignal
): Promise<string> {
  const { apiKey } = getGroqConfig();
  const form = new FormData();
  form.append("file", audio, "speech.webm");
  form.append("model", "whisper-large-v3-turbo");
  form.append("language", "es");
  form.append("prompt", "Mexican Spanish, A1 level. Palabras: hola, ¿qué onda?, gracias, ¿mande?, pluma, celular, tacos, órale.");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Groq STT error ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  return (json.text || "").trim();
}
