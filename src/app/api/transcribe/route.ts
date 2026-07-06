import { NextRequest } from "next/server";
import { transcribeWithGroq } from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.startsWith("audio/")) {
    return new Response(
      "Expected an audio/* request body (Blob), not multipart or JSON.",
      { status: 400 }
    );
  }
  const audio = await request.blob();
  if (!audio.size) {
    return new Response("Empty audio body", { status: 400 });
  }
  try {
    const text = await transcribeWithGroq(audio, request.signal);
    return Response.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "transcribe-error";
    return Response.json({ error: message }, { status: 502 });
  }
}
