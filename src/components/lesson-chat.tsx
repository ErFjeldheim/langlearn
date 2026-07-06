"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { type Lesson } from "@/lib/curriculum";
import {
  detectSupport,
  speak,
  stopSpeaking,
  startRecognition,
  splitIntoSentences,
  waitForVoices,
} from "@/lib/speech";

type Msg = { role: "user" | "assistant"; content: string };

type Props = {
  lesson: Lesson;
  initialHistory?: Msg[];
  onHistoryChange?: (history: Msg[]) => void;
};

export default function LessonChat({ lesson, initialHistory, onHistoryChange }: Props) {
  const [messages, setMessages] = useState<Msg[]>(
    initialHistory && initialHistory.length
      ? initialHistory
      : [{ role: "assistant", content: lesson.opener }]
  );
  const [streaming, setStreaming] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState<string>("");
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [support, setSupport] = useState(detectSupport());
  const [voiceReady, setVoiceReady] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const recRef = useRef<{ stop: () => void } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const speakingQueueRef = useRef<string>("");
  const fullTextRef = useRef<string>("");

  // Load a Mexican voice lazily (voices list may arrive async).
  useEffect(() => {
    let cancelled = false;
    waitForVoices().then(() => {
      if (cancelled) return;
      setSupport(detectSupport());
      setVoiceReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist history up to parent.
  useEffect(() => {
    onHistoryChange?.(messages);
  }, [messages, onHistoryChange]);

  // Autoscroll.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming, interim]);

  const sendToTeacher = useCallback(
    async (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed || loading) return;
      setError(null);
      stopSpeaking();
      setSpeaking(false);

      const newMessages: Msg[] = [...messages, { role: "user", content: trimmed }];
      setMessages(newMessages);
      setInterim("");
      setLoading(true);
      setStreaming("");
      fullTextRef.current = "";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            lessonContext: buildLessonContextString(lesson),
          }),
        });
        if (!res.ok || !res.body) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Chat request failed (${res.status}): ${txt.slice(0, 200)}`);
        }
        await readSSE(res.body, {
          onDelta: (token) => {
            setStreaming((prev) => prev + token);
            fullTextRef.current += token;
            // Buffer text and speak sentence-by-sentence as they complete.
            speakingQueueRef.current += token;
            const sentences = splitIntoSentences(speakingQueueRef.current);
            if (sentences.length > 1) {
              // Speak everything except the trailing incomplete sentence.
              const complete = sentences.slice(0, -1).join(" ");
              speakingQueueRef.current = sentences[sentences.length - 1];
              if (autoSpeak && support.synthesis && !speaking) {
                setSpeaking(true);
                speak(complete, { onDone: () => setSpeaking(false) });
              }
            }
          },
          onDone: () => {
            const finalText = fullTextRef.current;
            fullTextRef.current = "";
            speakingQueueRef.current = "";
            setStreaming("");
            if (finalText.trim()) {
              const fullAssistant: Msg = { role: "assistant", content: finalText };
              setMessages((prev) => [...prev, fullAssistant]);
              if (autoSpeak && support.synthesis && !speaking) {
                setSpeaking(true);
                speak(finalText, { onDone: () => setSpeaking(false) });
              }
            }
            setLoading(false);
          },
          onError: (err) => {
            setError(err);
            setLoading(false);
            setStreaming("");
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "chat-error");
        setLoading(false);
        setStreaming("");
      }
    },
    [messages, loading, lesson, autoSpeak, support.synthesis, speaking]
  );

  const toggleMic = useCallback(() => {
    if (recording) {
      recRef.current?.stop();
      return;
    }
    if (!support.recognition) {
      setError(
        "Este navegador no soporta reconocimiento de voz. Usa Chrome/Edge en Android o Safari en iOS."
      );
      return;
    }
    setError(null);
    setInterim("");
    setRecording(true);
    const handle = startRecognition({
      onResult: (text, isFinal) => {
        setInterim(text);
        if (isFinal) {
          setRecording(false);
          setInterim("");
          if (text.trim()) sendToTeacher(text);
        }
      },
      onError: (err) => {
        setRecording(false);
        setInterim("");
        if (err === "no-speech") {
          setError("No te escuché. Intenta de nuevo.");
        } else if (err === "not-allowed" || err === "service-not-allowed") {
          setError("Necesito permiso para usar el micrófono.");
        } else {
          setError(`Mic error: ${err}`);
        }
      },
      onEnd: () => {
        setRecording(false);
      },
    });
    recRef.current = handle;
  }, [recording, support.recognition, sendToTeacher]);

  const stopAll = useCallback(() => {
    if (loading) {
      // abort in-flight fetch by ignoring; full abort needs an AbortController
    }
    stopSpeaking();
    setSpeaking(false);
    recRef.current?.stop();
    setRecording(false);
  }, [loading]);

  const displayMessages = streaming
    ? [...messages, { role: "assistant" as const, content: streaming }]
    : messages;

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Día {lesson.day} · {lesson.topic}
          </p>
          <h1 className="text-lg font-semibold">{lesson.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoSpeak((v) => !v)}
            className={`rounded-md border border-border px-2.5 py-1.5 text-xs ${
              autoSpeak ? "bg-primary text-primary-foreground" : "bg-transparent"
            }`}
            aria-pressed={autoSpeak}
            title="Activar/desactivar voz de la profe"
          >
            Voz: {autoSpeak ? "On" : "Off"}
          </button>
          <button
            type="button"
            onClick={stopAll}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs"
          >
            Parar
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {displayMessages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {interim && (
          <Bubble role="user" content={interim} muted />
        )}
        {loading && !streaming && (
          <div className="text-sm text-muted-foreground italic">Profe Sofía está pensando…</div>
        )}
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-card/60 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            type="button"
            onClick={toggleMic}
            disabled={loading}
            aria-label={recording ? "Detener" : "Hablar"}
            className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 transition ${
              recording
                ? "border-primary bg-primary/20 mic-recording"
                : "border-border bg-background hover:border-primary"
            } disabled:opacity-40`}
          >
            <MicIcon recording={recording} />
          </button>
          <div className="flex-1 text-sm text-muted-foreground">
            {recording ? (
              <span className="text-primary">Escuchando… habla en español.</span>
            ) : support.recognition ? (
              <span>Toca el micrófono y responde en español.</span>
            ) : (
              <span>
                Sin mic en este navegador. Puedes escribir abajo y pulsar Enviar.
              </span>
            )}
          </div>
        </div>
        <TextInput onSubmit={sendToTeacher} disabled={loading || recording} />
        {!support.synthesis && (
          <p className="mt-2 text-center text-xs text-amber-300/80">
            Tu navegador no sintetiza voz. La profe seguirá escribiendo sus frases.
          </p>
        )}
        {support.synthesis && !support.mexicanVoice && voiceReady && (
          <p className="mt-2 text-center text-xs text-amber-300/80">
            No detecté voz mexicana es-MX; usaré la voz española disponible.
          </p>
        )}
      </div>
    </div>
  );
}

function Bubble({
  role,
  content,
  muted,
}: {
  role: "user" | "assistant";
  content: string;
  muted?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[0.95rem] leading-relaxed ${
          isUser
            ? muted
              ? "bg-muted text-muted-foreground italic"
              : "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground border border-border"
        }`}
      >
        {!isUser && (
          <div className="mb-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-primary">
            Profe Sofía
          </div>
        )}
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

function MicIcon({ recording }: { recording: boolean }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke={recording ? "#16a34a" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function TextInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (text: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim() || disabled) return;
        onSubmit(value);
        setValue("");
      }}
      className="mx-auto mt-3 flex max-w-2xl items-center gap-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Escribe en español…"
        disabled={disabled}
        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
      >
        Enviar
      </button>
    </form>
  );
}

function buildLessonContextString(lesson: Lesson): string {
  const vocabList = lesson.vocab
    .map((v) => `  - ${v.term} (${v.translation})`)
    .join("\n");
  return `CURRENT LESSON (Day ${lesson.day}): ${lesson.title}
Topic: ${lesson.topic}
Objectives: ${lesson.objectives.join("; ")}
Target vocabulary for this lesson (use these naturally, gloss each only on first use):
${vocabList}
Open and continue the lesson naturally in Spanish. Short turns, one question at a time.`;
}

type SSEHandlers = {
  onDelta: (token: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
};

async function readSSE(
  body: ReadableStream<Uint8Array>,
  handlers: SSEHandlers
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const raw of events) {
      const lines = raw.split("\n");
      let event = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data = line.slice(5).trim();
      }
      if (!data) continue;
      if (event === "delta") {
        try {
          const obj = JSON.parse(data);
          if (typeof obj.token === "string") handlers.onDelta(obj.token);
        } catch {}
      } else if (event === "done") {
        handlers.onDone();
        return;
      } else if (event === "error") {
        try {
          const obj = JSON.parse(data);
          handlers.onError(obj.error || "error");
        } catch {
          handlers.onError("error");
        }
        return;
      }
    }
  }
  handlers.onDone();
}
