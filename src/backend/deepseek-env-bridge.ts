// The AI writer runs in both the Astro app and the service-plugin bundle, and the latter
// cannot import `astro:env/server`. The Astro middleware (src/middleware.ts) reads the key
// per request and publishes it here; both bundles share the worker's globalThis.
const KEY = Symbol.for('deepseek-api-key');

type Holder = typeof globalThis & { [KEY]?: string | undefined };

export function publishDeepSeekApiKey(apiKey: string | undefined): void {
  (globalThis as Holder)[KEY] = apiKey;
}

export function readDeepSeekApiKey(): string | undefined {
  return (globalThis as Holder)[KEY];
}
