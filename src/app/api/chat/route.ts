import { NextRequest } from "next/server";
import { streamOpenCodeCompletion, type ChatMessage } from "@/lib/opencode-go";
import { TEACHER_SYSTEM_PROMPT } from "@/lib/teacher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  messages: ChatMessage[];
  lessonContext?: string;
  drillContext?: string;
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response("`messages` array is required", { status: 400 });
  }

  const system: ChatMessage = {
    role: "system",
    content: [TEACHER_SYSTEM_PROMPT, body.lessonContext, body.drillContext]
      .filter(Boolean)
      .join("\n\n---\n\n"),
  };

  const messages: ChatMessage[] = [system, ...body.messages];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: string) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${data}\n\n`)
        );
      };
      try {
        for await (const token of streamOpenCodeCompletion({
          messages,
          temperature: 0.7,
          signal: request.signal,
        })) {
          send("delta", JSON.stringify({ token }));
        }
        send("done", JSON.stringify({ ok: true }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "stream-error";
        send("error", JSON.stringify({ error: message }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
