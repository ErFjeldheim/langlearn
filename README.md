# LangLearn — Profe Sofía

A1 Mexican Spanish speaking-practice PWA. Talk to **Profe Sofía**, a teacher from Monterrey, to get ready for an exchange semester at Tec de Monterrey.

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind v4
- **LLM**: OpenCode Go `gpt-5.6-luna` via server-side proxy
- **Speech**: Browser Web Speech API (STT `es-MX` + TTS `es-MX`); Groq Whisper `whisper-large-v3-turbo` fallback endpoint at `/api/transcribe`
- **Data**: Pocketbase (auth, conversation history, SRS vocabulary, progress)
- **Deploy**: Dokploy (standalone Docker build)

## Local development

```bash
cp .env.example .env
# fill in OPENCODE_API_KEY and NEXT_PUBLIC_PB_URL
# optionally fill in GROQ_API_KEY for Whisper transcription fallback
npm install
npm run dev
```

## Pocketbase setup (one-time)

Create a Pocketbase instance (e.g. via a Dokploy compose service), set the env below, and run:

```bash
PB_URL=https://pb-langlearn.<your-domain> \
PB_ADMIN_EMAIL=admin@example.com \
PB_ADMIN_PASSWORD=<admin-pw> \
LL_USER_EMAIL=erik@example.com \
LL_USER_PASSWORD=<user-pw> \
npm run setup:pb
```

This creates the `vocabulary`, `conversations`, and `progress` collections (owner-scoped API rules) and the single user account.

## Curriculum

25 A1 lessons, Monterrey-exchange flavored, in `src/lib/curriculum.ts`. Day 25 is a pre-flight mixed review.

## Deployment (Dokploy)

The `Dockerfile` produces a `node:20-alpine` image running the Next.js standalone server on port 3000. Configure env vars in Dokploy and attach the domain.
