// Client-only Web Speech API helpers for STT (es-MX) and TTS (es-MX).
// No SSR imports of window/SpeechRecognition here — guard at call sites.

import type {
  ISpeechRecognition,
  SpeechRecognitionConstructor,
  SpeechRecognitionEvent,
} from "@/types/speech";

export type SpeechSupport = {
  recognition: boolean;
  synthesis: boolean;
  mexicanVoice: boolean;
};

export function detectSupport(): SpeechSupport {
  if (typeof window === "undefined") {
    return { recognition: false, synthesis: false, mexicanVoice: false };
  }
  const recognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const synthesis = "speechSynthesis" in window;
  const mexicanVoice = synthesis && pickMexicanVoice() !== null;
  return { recognition, synthesis, mexicanVoice };
}

export function pickMexicanVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Prefer es-MX, then any Mexican-sounding voice, then es-419, then es-ES, then any es.
  return (
    voices.find((v) => v.lang === "es-MX") ||
    voices.find((v) => /mx|mex/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("es-419")) ||
    voices.find((v) => v.lang.startsWith("es")) ||
    null
  );
}

export function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) {
      resolve(existing);
      return;
    }
    let settled = false;
    const handler = () => {
      if (settled) return;
      settled = true;
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler, { once: true });
    // Fallback in case voiceschanged never fires.
    setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(window.speechSynthesis.getVoices());
    }, 1500);
  });
}

export type RecognitionHandlers = {
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
};

export function startRecognition(handlers: RecognitionHandlers): {
  stop: () => void;
} | null {
  if (typeof window === "undefined") return null;
  const SR: SpeechRecognitionConstructor | undefined =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  const rec: ISpeechRecognition = new SR();
  rec.lang = "es-MX";
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  let finalText = "";

  rec.onresult = (event: SpeechRecognitionEvent) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      if (res.isFinal) {
        finalText += res[0].transcript;
      } else {
        interim += res[0].transcript;
      }
    }
    handlers.onResult(
      (finalText + interim).trim(),
      event.results[event.results.length - 1].isFinal
    );
  };
  rec.onerror = (e) => {
    handlers.onError?.(e.error || "recognition-error");
  };
  rec.onend = () => {
    handlers.onEnd?.();
  };

  try {
    rec.start();
  } catch (err) {
    handlers.onError?.(String(err));
    return null;
  }
  return {
    stop: () => {
      try {
        rec.stop();
      } catch {}
    },
  };
}

// Split streamed text into spoken sentences and queue TTS utterances.
export function speak(
  text: string,
  opts?: { onBoundary?: (spoken: number, total: number) => void; onDone?: () => void }
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const voice = pickMexicanVoice();
  const chunks = splitIntoSentences(text);
  if (!chunks.length) {
    opts?.onDone?.();
    return;
  }
  let idx = 0;
  const speakNext = () => {
    if (idx >= chunks.length) {
      opts?.onDone?.();
      return;
    }
    const u = new SpeechSynthesisUtterance(chunks[idx]);
    u.lang = "es-MX";
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.pitch = 1;
    const current = idx;
    idx += 1;
    u.onend = () => {
      opts?.onBoundary?.(current + 1, chunks.length);
      speakNext();
    };
    u.onerror = () => {
      opts?.onDone?.();
    };
    window.speechSynthesis.speak(u);
  };
  speakNext();
}

export function stopSpeaking(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

export function splitIntoSentences(text: string): string[] {
  // Split on . ! ? and also ¿...! / ¡...! style but keep readable chunks.
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  // Match sentence-ending punctuation followed by space/end. Keep punctuation.
  const parts = cleaned.match(/[^.!?¡¿]+[.!?]+(?:["'”’)\]]*)|\S[^.!?¡¿]*$/g);
  return (parts || [cleaned]).map((p) => p.trim()).filter(Boolean);
}
