// Minimal installable service worker. The app needs network for the LLM + Pocketbase,
// so we intentionally do NOT cache aggressively — this SW exists only to make the
// PWA installable and to keep the registration scope at "/".

self.addEventListener("install", (event) => {
  // Activate immediately on next load.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// No custom fetch handling: fall through to the network.
